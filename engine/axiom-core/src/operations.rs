//! Operations — mutations on the document model.
//!
//! Every change to the document goes through an Operation.
//! Operations are the unit of undo/redo and sync.

use crate::node::NodeId;
use crate::properties::{PropertyKey, PropertyValue};
use serde::{Deserialize, Serialize};

/// An operation on the document.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Operation {
    /// Insert a new node as a child of parent.
    InsertNode {
        parent_id: NodeId,
        node_id: NodeId,
        after: Option<NodeId>,   // Insert after this sibling (None = prepend)
    },

    /// Remove a node from its parent.
    RemoveNode {
        parent_id: NodeId,
        node_id: NodeId,
    },

    /// Set a property on a node.
    SetProperty {
        node_id: NodeId,
        key: PropertyKey,
        value: PropertyValue,
    },

    /// Remove a property from a node.
    RemoveProperty {
        node_id: NodeId,
        key: PropertyKey,
    },

    /// Set the text content of a text node.
    SetText {
        node_id: NodeId,
        text: String,
    },

    /// Move a node to a new parent/position.
    MoveNode {
        node_id: NodeId,
        old_parent_id: NodeId,
        new_parent_id: NodeId,
        after: Option<NodeId>,
    },
}

/// A batch of operations (for undo/redo grouping).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    pub operations: Vec<Operation>,
    pub timestamp: u64,
}

impl Transaction {
    pub fn new() -> Self {
        Self {
            operations: Vec::new(),
            timestamp: 0,
        }
    }

    pub fn push(&mut self, op: Operation) {
        self.operations.push(op);
    }
}

impl Default for Transaction {
    fn default() -> Self {
        Self::new()
    }
}
