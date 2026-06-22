//! Property system for nodes.
//!
//! Every node has a property map: Map<PropertyKey, PropertyValue>.
//! This is the Figma-inspired approach — conflict resolution happens
//! at the property level (LWW).

use serde::{Deserialize, Serialize};

/// Property keys — the vocabulary of node attributes.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum PropertyKey {
    // Type discriminators
    BlockKind,
    InlineKind,
    EmbedKind,

    // Text formatting
    Bold,
    Italic,
    Underline,
    Strikethrough,
    FontFamily,
    FontSize,
    FontWeight,
    FontColor,
    BackgroundColor,
    LetterSpacing,
    LineHeight,

    // Alignment
    TextAlign,

    // Block properties
    IndentLevel,
    ListStyle,

    // Image / embed properties
    Src,
    Alt,
    Width,
    Height,
    AspectRatio,
    ObjectFit,

    // Image tiling (auto-frame feature)
    TileDirection,  // "horizontal" | "vertical"
    TileColumns,
    TileGap,

    // Link
    Href,
    Target,

    // Code
    Language,

    // Label / metadata
    Label,
    PageNumber,

    // Layout hints
    MarginTop,
    MarginBottom,
    PaddingTop,
    PaddingBottom,

    // Custom / extensible
    Custom(String),
}

/// Property values — the data stored for each property.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum PropertyValue {
    Bool(bool),
    Int(i64),
    Float(f64),
    String(String),
    Color(String),         // hex or rgba
    Enum(String),          // named variant
    Array(Vec<PropertyValue>),
}

impl PropertyValue {
    pub fn as_bool(&self) -> Option<bool> {
        match self {
            PropertyValue::Bool(v) => Some(*v),
            _ => None,
        }
    }

    pub fn as_string(&self) -> Option<&str> {
        match self {
            PropertyValue::String(v) => Some(v),
            PropertyValue::Enum(v) => Some(v),
            PropertyValue::Color(v) => Some(v),
            _ => None,
        }
    }

    pub fn as_float(&self) -> Option<f64> {
        match self {
            PropertyValue::Float(v) => Some(*v),
            PropertyValue::Int(v) => Some(*v as f64),
            _ => None,
        }
    }
}
