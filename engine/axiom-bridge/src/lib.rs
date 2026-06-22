//! # Axiom Bridge
//!
//! The WASM ↔ TypeScript bridge. This is the public API surface
//! that the TypeScript shell calls via wasm-bindgen.
//!
//! Provides:
//! - Document creation and manipulation
//! - Command handling
//! - Document serialization (for rendering / sync)

use wasm_bindgen::prelude::*;
use axiom_core::document::Document;
use axiom_core::node::{Node, BlockKind};
use axiom_core::properties::{PropertyKey, PropertyValue};

/// Log to the browser console.
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

macro_rules! console_log {
    ($($t:tt)*) => (log(&format!($($t)*)))
}

// ── Engine State ────────────────────────────────────────────

/// The Axiom engine instance — holds the document and all state.
#[wasm_bindgen]
pub struct AxiomEngine {
    document: Document,
}

#[wasm_bindgen]
impl AxiomEngine {
    /// Create a new engine with an empty document.
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        console_log!("[Axiom Engine] Initialized — {} nodes", 4);
        Self {
            document: Document::new(),
        }
    }

    /// Get the total number of nodes in the document.
    #[wasm_bindgen(js_name = "nodeCount")]
    pub fn node_count(&self) -> usize {
        self.document.node_count()
    }

    /// Get the number of pages.
    #[wasm_bindgen(js_name = "pageCount")]
    pub fn page_count(&self) -> usize {
        self.document.pages().len()
    }

    /// Insert a text block at the end of the first page.
    #[wasm_bindgen(js_name = "insertParagraph")]
    pub fn insert_paragraph(&mut self, text: &str) -> String {
        let pages = self.document.pages();
        if let Some(page) = pages.first() {
            let page_id = page.id;

            // Create paragraph with text child
            let mut para = Node::block(BlockKind::Paragraph);
            let para_id = para.id;

            let text_node = Node::text(text);
            let text_id = text_node.id;

            para.append_child(text_id);

            // Insert into document store
            self.document.insert_node(text_node);
            self.document.insert_node(para);

            // Add to page's children
            if let Some(page_node) = self.document.get_node_mut(&page_id) {
                page_node.append_child(para_id);
            }

            console_log!("[Axiom Engine] Inserted paragraph: '{}'", text);
            para_id.to_string()
        } else {
            String::new()
        }
    }

    /// Format a node property (bold, italic, etc.).
    #[wasm_bindgen(js_name = "formatNode")]
    pub fn format_node(&mut self, node_id_str: &str, property: &str, value: bool) -> bool {
        if let Ok(node_id) = uuid::Uuid::parse_str(node_id_str) {
            if let Some(node) = self.document.get_node_mut(&node_id) {
                let key = match property {
                    "bold" => PropertyKey::Bold,
                    "italic" => PropertyKey::Italic,
                    "underline" => PropertyKey::Underline,
                    "strikethrough" => PropertyKey::Strikethrough,
                    _ => return false,
                };
                node.set_property(key, PropertyValue::Bool(value));
                console_log!("[Axiom Engine] Set {} = {} on node {}", property, value, node_id_str);
                true
            } else {
                false
            }
        } else {
            false
        }
    }

    /// Serialize the document tree to JSON (for debugging / rendering).
    #[wasm_bindgen(js_name = "toJSON")]
    pub fn to_json(&self) -> String {
        let mut output = Vec::new();
        self.document.walk(&self.document.root_id(), &mut |node, depth| {
            let indent = "  ".repeat(depth);
            let type_str = format!("{:?}", node.node_type);
            let text_str = node.text.as_deref().unwrap_or("");
            output.push(format!("{}{} [{}] {}", indent, type_str, node.id, text_str));
        });
        output.join("\n")
    }

    /// Get the engine version.
    #[wasm_bindgen(js_name = "version")]
    pub fn version(&self) -> String {
        format!("Axiom Engine v{} (Rust/WASM)", env!("CARGO_PKG_VERSION"))
    }

    /// Parse raw LaTeX code and replace the engine's current document state.
    #[wasm_bindgen(js_name = "parseLaTeX")]
    pub fn parse_latex(&mut self, code: &str) -> String {
        self.document = axiom_core::parser::parse_latex(code);
        self.to_json()
    }

    /// Parse HTML string and replace the engine's current document state.
    #[wasm_bindgen(js_name = "parseHTML")]
    pub fn parse_html(&mut self, html: &str) -> String {
        self.document = axiom_core::parser::parse_html(html);
        self.to_json()
    }

    /// Convert the active document back to raw LaTeX source code.
    #[wasm_bindgen(js_name = "toLaTeX")]
    pub fn to_latex(&self) -> String {
        axiom_core::parser::to_latex(&self.document)
    }

    /// Compile the active document into standard HTML blocks for rendering.
    #[wasm_bindgen(js_name = "toHTML")]
    pub fn to_html(&self) -> String {
        axiom_core::parser::to_html(&self.document)
    }

    /// Convert the active document to body-only LaTeX (no preamble).
    #[wasm_bindgen(js_name = "toLaTeXBody")]
    pub fn to_latex_body(&self) -> String {
        axiom_core::parser::to_latex_body(&self.document)
    }
}

impl Default for AxiomEngine {
    fn default() -> Self {
        Self::new()
    }
}
