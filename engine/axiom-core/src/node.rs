//! Node types and the node tree structure.
//!
//! Every element in an Axiom document is a Node.
//! Nodes form a tree: Document → Pages → Blocks → Inlines.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

use crate::fractional_index::FractionalIndex;
use crate::properties::{PropertyKey, PropertyValue};

/// Unique identifier for a node.
pub type NodeId = Uuid;

/// The type of a node in the document tree.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum NodeType {
    /// Root document node
    Document,
    /// A page (physical page boundary)
    Page,
    /// Block-level element (heading, paragraph, list, figure, etc.)
    Block,
    /// Inline element (text run, inline code, link, etc.)
    Inline,
    /// Embedded content (image, equation, table, etc.)
    Embed,
}

/// The kind of block this node represents.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum BlockKind {
    Paragraph,
    Heading1,
    Heading2,
    Heading3,
    Heading4,
    Heading5,
    Heading6,
    BlockQuote,
    CodeBlock,
    UnorderedList,
    OrderedList,
    ListItem,
    Figure,
    HorizontalRule,
    Table,
    TableRow,
    TableCell,
}

/// The kind of inline this node represents.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum InlineKind {
    Text,
    Link,
    InlineCode,
    Math,
    Footnote,
}

/// The kind of embed this node represents.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum EmbedKind {
    Image,
    Equation,
    Video,
    File,
}

/// A node in the Axiom document tree.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Node {
    /// Unique identifier
    pub id: NodeId,

    /// What type of node this is
    pub node_type: NodeType,

    /// Properties (formatting, layout, metadata)
    pub properties: HashMap<PropertyKey, PropertyValue>,

    /// Ordered children (fractional indexing)
    pub children: Vec<ChildEntry>,

    /// Text content (only for Inline::Text nodes)
    pub text: Option<String>,
}

/// A child reference with fractional index for ordering.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChildEntry {
    pub node_id: NodeId,
    pub order: FractionalIndex,
}

impl Node {
    /// Create a new node with the given type.
    pub fn new(node_type: NodeType) -> Self {
        Self {
            id: Uuid::new_v4(),
            node_type,
            properties: HashMap::new(),
            children: Vec::new(),
            text: None,
        }
    }

    /// Create a text node with content.
    pub fn text(content: &str) -> Self {
        let mut node = Self::new(NodeType::Inline);
        node.properties.insert(
            PropertyKey::InlineKind,
            PropertyValue::String("text".to_string()),
        );
        node.text = Some(content.to_string());
        node
    }

    /// Create a block node of the specified kind.
    pub fn block(kind: BlockKind) -> Self {
        let mut node = Self::new(NodeType::Block);
        node.properties.insert(
            PropertyKey::BlockKind,
            PropertyValue::String(format!("{:?}", kind)),
        );
        node
    }

    /// Set a property on this node.
    pub fn set_property(&mut self, key: PropertyKey, value: PropertyValue) {
        self.properties.insert(key, value);
    }

    /// Get a property value.
    pub fn get_property(&self, key: &PropertyKey) -> Option<&PropertyValue> {
        self.properties.get(key)
    }

    /// Add a child node at the end.
    pub fn append_child(&mut self, child_id: NodeId) {
        let order = if let Some(last) = self.children.last() {
            last.order.next()
        } else {
            FractionalIndex::initial()
        };
        self.children.push(ChildEntry {
            node_id: child_id,
            order,
        });
    }

    /// Insert a child between two existing children.
    pub fn insert_child_between(
        &mut self,
        child_id: NodeId,
        before: Option<&FractionalIndex>,
        after: Option<&FractionalIndex>,
    ) {
        let order = FractionalIndex::between(before, after);
        self.children.push(ChildEntry {
            node_id: child_id,
            order,
        });
        self.children.sort_by(|a, b| a.order.cmp(&b.order));
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn create_text_node() {
        let node = Node::text("Hello, Axiom!");
        assert_eq!(node.text, Some("Hello, Axiom!".to_string()));
        assert_eq!(node.node_type, NodeType::Inline);
    }

    #[test]
    fn create_block_node() {
        let node = Node::block(BlockKind::Paragraph);
        assert_eq!(node.node_type, NodeType::Block);
    }

    #[test]
    fn append_children() {
        let mut parent = Node::new(NodeType::Block);
        let child1 = Node::text("First");
        let child2 = Node::text("Second");

        parent.append_child(child1.id);
        parent.append_child(child2.id);

        assert_eq!(parent.children.len(), 2);
        assert!(parent.children[0].order < parent.children[1].order);
    }
}
