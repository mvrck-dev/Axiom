//! Document — the top-level container.
//!
//! A Document owns a flat store of all nodes (arena-style)
//! and provides methods to traverse, query, and mutate the tree.

use std::collections::HashMap;

use crate::node::{Node, NodeId, NodeType, BlockKind};

/// The document — a flat arena of nodes with a root pointer.
#[derive(Debug, Clone)]
pub struct Document {
    /// All nodes, keyed by ID
    nodes: HashMap<NodeId, Node>,

    /// The root document node ID
    root_id: NodeId,
}

impl Document {
    /// Create a document from raw parts (e.g. for parsing).
    pub fn from_parts(nodes: HashMap<NodeId, Node>, root_id: NodeId) -> Self {
        Self { nodes, root_id }
    }

    /// Create a new empty document with a single page.
    pub fn new() -> Self {
        let mut root = Node::new(NodeType::Document);
        let root_id = root.id;

        let mut page = Node::new(NodeType::Page);
        let page_id = page.id;

        // Add a default paragraph to the page
        let mut para = Node::block(BlockKind::Paragraph);
        let para_id = para.id;

        let text = Node::text("");
        let text_id = text.id;

        para.append_child(text_id);
        page.append_child(para_id);
        root.append_child(page_id);

        let mut nodes = HashMap::new();
        nodes.insert(root_id, root);
        nodes.insert(page_id, page);
        nodes.insert(para_id, para);
        nodes.insert(text_id, text);

        Self { nodes, root_id }
    }

    /// Get the root node ID.
    pub fn root_id(&self) -> NodeId {
        self.root_id
    }

    /// Get a node by ID.
    pub fn get_node(&self, id: &NodeId) -> Option<&Node> {
        self.nodes.get(id)
    }

    /// Get a mutable reference to a node.
    pub fn get_node_mut(&mut self, id: &NodeId) -> Option<&mut Node> {
        self.nodes.get_mut(id)
    }

    /// Insert a new node into the document store.
    pub fn insert_node(&mut self, node: Node) -> NodeId {
        let id = node.id;
        self.nodes.insert(id, node);
        id
    }

    /// Remove a node from the store (does not unlink from parent).
    pub fn remove_node(&mut self, id: &NodeId) -> Option<Node> {
        self.nodes.remove(id)
    }

    /// Get all pages in the document.
    pub fn pages(&self) -> Vec<&Node> {
        let root = self.nodes.get(&self.root_id).unwrap();
        root.children
            .iter()
            .filter_map(|entry| self.nodes.get(&entry.node_id))
            .collect()
    }

    /// Count total nodes in the document.
    pub fn node_count(&self) -> usize {
        self.nodes.len()
    }

    /// Walk all nodes depth-first from a starting node.
    pub fn walk(&self, start: &NodeId, visitor: &mut dyn FnMut(&Node, usize)) {
        self.walk_recursive(start, 0, visitor);
    }

    fn walk_recursive(
        &self,
        node_id: &NodeId,
        depth: usize,
        visitor: &mut dyn FnMut(&Node, usize),
    ) {
        if let Some(node) = self.nodes.get(node_id) {
            visitor(node, depth);
            for child in &node.children {
                self.walk_recursive(&child.node_id, depth + 1, visitor);
            }
        }
    }
}

impl Default for Document {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn new_document_has_structure() {
        let doc = Document::new();
        // Root → Page → Paragraph → Text = 4 nodes
        assert_eq!(doc.node_count(), 4);
        assert_eq!(doc.pages().len(), 1);
    }

    #[test]
    fn walk_visits_all_nodes() {
        let doc = Document::new();
        let mut count = 0;
        doc.walk(&doc.root_id(), &mut |_, _| count += 1);
        assert_eq!(count, 4);
    }
}
