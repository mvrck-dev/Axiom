use crate::document::Document;
use crate::node::{Node, NodeId, NodeType, BlockKind};
use crate::properties::{PropertyKey, PropertyValue};
use std::collections::HashMap;

/// Helper to parse inline nodes with recursive formatting (bold, italic, etc.) and math
pub fn parse_inlines(text: &str) -> Vec<Node> {
    let mut result = Vec::new();
    let chars: Vec<char> = text.chars().collect();
    let mut i = 0;
    
    // Track current active formatting properties
    let mut current_props: HashMap<PropertyKey, PropertyValue> = HashMap::new();
    
    while i < chars.len() {
        if chars[i] == '\\' && i + 1 < chars.len() {
            // Check for format macros
            let remaining: String = chars[i+1..].iter().collect();
            if remaining.starts_with("textbf{") {
                i += 8; // skip \textbf{
                let content = extract_braces_content(&chars, &mut i);
                let nested = parse_inlines(&content);
                for mut node in nested {
                    node.set_property(PropertyKey::Bold, PropertyValue::Bool(true));
                    result.push(node);
                }
                continue;
            } else if remaining.starts_with("textit{") {
                i += 8; // skip \textit{
                let content = extract_braces_content(&chars, &mut i);
                let nested = parse_inlines(&content);
                for mut node in nested {
                    node.set_property(PropertyKey::Italic, PropertyValue::Bool(true));
                    result.push(node);
                }
                continue;
            } else if remaining.starts_with("underline{") {
                i += 11; // skip \underline{
                let content = extract_braces_content(&chars, &mut i);
                let nested = parse_inlines(&content);
                for mut node in nested {
                    node.set_property(PropertyKey::Underline, PropertyValue::Bool(true));
                    result.push(node);
                }
                continue;
            } else if remaining.starts_with("sout{") {
                i += 6; // skip \sout{
                let content = extract_braces_content(&chars, &mut i);
                let nested = parse_inlines(&content);
                for mut node in nested {
                    node.set_property(PropertyKey::Strikethrough, PropertyValue::Bool(true));
                    result.push(node);
                }
                continue;
            }
        }
        
        // Scan for inline math $...$
        if chars[i] == '$' {
            let mut math_content = String::new();
            i += 1; // skip opening $
            while i < chars.len() && chars[i] != '$' {
                math_content.push(chars[i]);
                i += 1;
            }
            if i < chars.len() {
                i += 1; // skip closing $
            }
            
            let mut math_node = Node::new(NodeType::Inline);
            math_node.set_property(PropertyKey::InlineKind, PropertyValue::String("math".to_string()));
            math_node.text = Some(math_content);
            result.push(math_node);
            continue;
        }
        
        // Scan plain text run
        let mut text_run = String::new();
        while i < chars.len() && chars[i] != '$' && chars[i] != '\\' {
            text_run.push(chars[i]);
            i += 1;
        }
        if !text_run.is_empty() {
            let mut text_node = Node::text(&text_run);
            // Apply current inherited formats if any
            for (key, val) in &current_props {
                text_node.set_property(key.clone(), val.clone());
            }
            result.push(text_node);
        }
    }
    
    result
}

fn extract_braces_content(chars: &[char], index: &mut usize) -> String {
    let mut brace_count = 1;
    let mut content = String::new();
    while *index < chars.len() && brace_count > 0 {
        let c = chars[*index];
        if c == '{' {
            brace_count += 1;
        } else if c == '}' {
            brace_count -= 1;
        }
        if brace_count > 0 {
            content.push(c);
        }
        *index += 1;
    }
    content
}

/// Parse raw LaTeX code and output a Document node tree
pub fn parse_latex(code: &str) -> Document {
    // Re-initialize a blank root document and page
    let mut root = Node::new(NodeType::Document);
    let root_id = root.id;
    let mut page = Node::new(NodeType::Page);
    let page_id = page.id;
    
    let mut nodes: HashMap<NodeId, Node> = HashMap::new();
    
    let lines: Vec<&str> = code.lines().map(|l| l.trim()).collect();
    let mut idx = 0;
    
    while idx < lines.len() {
        let line = lines[idx];
        if line.is_empty() {
            idx += 1;
            continue;
        }
        
        // Ignore LaTeX document wrappers
        if line.starts_with("\\documentclass") || line.starts_with("\\begin{document}") || line.starts_with("\\end{document}") || line.starts_with("\\use") {
            idx += 1;
            continue;
        }
        
        // Headings
        if line.starts_with("\\section{") {
            let mut heading = Node::block(BlockKind::Heading1);
            let h_id = heading.id;
            let start = 9;
            let content = line[start..line.len()-1].to_string();
            let inlines = parse_inlines(&content);
            for inline in inlines {
                heading.append_child(inline.id);
                nodes.insert(inline.id, inline);
            }
            page.append_child(h_id);
            nodes.insert(h_id, heading);
            idx += 1;
            continue;
        }
        
        if line.starts_with("\\subsection{") {
            let mut heading = Node::block(BlockKind::Heading2);
            let h_id = heading.id;
            let start = 12;
            let content = line[start..line.len()-1].to_string();
            let inlines = parse_inlines(&content);
            for inline in inlines {
                heading.append_child(inline.id);
                nodes.insert(inline.id, inline);
            }
            page.append_child(h_id);
            nodes.insert(h_id, heading);
            idx += 1;
            continue;
        }

        if line.starts_with("\\subsubsection{") {
            let mut heading = Node::block(BlockKind::Heading3);
            let h_id = heading.id;
            let start = 15;
            let content = line[start..line.len()-1].to_string();
            let inlines = parse_inlines(&content);
            for inline in inlines {
                heading.append_child(inline.id);
                nodes.insert(inline.id, inline);
            }
            page.append_child(h_id);
            nodes.insert(h_id, heading);
            idx += 1;
            continue;
        }
        
        // Itemize environments
        if line.starts_with("\\begin{itemize}") {
            let mut list = Node::block(BlockKind::UnorderedList);
            let list_id = list.id;
            idx += 1;
            while idx < lines.len() && !lines[idx].starts_with("\\end{itemize}") {
                let item_line = lines[idx];
                if item_line.starts_with("\\item") {
                    let text = item_line[5..].trim();
                    let mut item = Node::block(BlockKind::ListItem);
                    let item_id = item.id;
                    let inlines = parse_inlines(text);
                    for inline in inlines {
                        item.append_child(inline.id);
                        nodes.insert(inline.id, inline);
                    }
                    list.append_child(item_id);
                    nodes.insert(item_id, item);
                }
                idx += 1;
            }
            page.append_child(list_id);
            nodes.insert(list_id, list);
            if idx < lines.len() { idx += 1; }
            continue;
        }

        // Enumerate environments
        if line.starts_with("\\begin{enumerate}") {
            let mut list = Node::block(BlockKind::OrderedList);
            let list_id = list.id;
            idx += 1;
            while idx < lines.len() && !lines[idx].starts_with("\\end{enumerate}") {
                let item_line = lines[idx];
                if item_line.starts_with("\\item") {
                    let text = item_line[5..].trim();
                    let mut item = Node::block(BlockKind::ListItem);
                    let item_id = item.id;
                    let inlines = parse_inlines(text);
                    for inline in inlines {
                        item.append_child(inline.id);
                        nodes.insert(inline.id, inline);
                    }
                    list.append_child(item_id);
                    nodes.insert(item_id, item);
                }
                idx += 1;
            }
            page.append_child(list_id);
            nodes.insert(list_id, list);
            if idx < lines.len() { idx += 1; }
            continue;
        }
        
        // Blockquote environments
        if line.starts_with("\\begin{quote}") {
            let mut quote = Node::block(BlockKind::BlockQuote);
            let quote_id = quote.id;
            idx += 1;
            let mut content = String::new();
            while idx < lines.len() && !lines[idx].starts_with("\\end{quote}") {
                content.push_str(lines[idx]);
                content.push(' ');
                idx += 1;
            }
            let inlines = parse_inlines(content.trim());
            for inline in inlines {
                quote.append_child(inline.id);
                nodes.insert(inline.id, inline);
            }
            page.append_child(quote_id);
            nodes.insert(quote_id, quote);
            if idx < lines.len() { idx += 1; }
            continue;
        }

        // Display math blocks
        if line.starts_with("$$") || line.starts_with("\\[") {
            let mut is_display = true;
            let mut math_code = String::new();
            let delimiter = if line.starts_with("$$") { "$$" } else { "\\]" };
            
            if line.ends_with(delimiter) && line.len() > 2 {
                math_code = line[2..line.len()-delimiter.len()].to_string();
            } else {
                idx += 1;
                while idx < lines.len() && !lines[idx].starts_with(delimiter) {
                    math_code.push_str(lines[idx]);
                    math_code.push('\n');
                    idx += 1;
                }
                if idx < lines.len() { idx += 1; }
            }
            
            let mut para = Node::block(BlockKind::Paragraph);
            let para_id = para.id;
            let mut math_node = Node::new(NodeType::Inline);
            math_node.set_property(PropertyKey::InlineKind, PropertyValue::String("math".to_string()));
            math_node.text = Some(math_code.trim().to_string());
            
            para.append_child(math_node.id);
            nodes.insert(math_node.id, math_node);
            page.append_child(para_id);
            nodes.insert(para_id, para);
            continue;
        }

        // Standard Paragraphs
        let mut para = Node::block(BlockKind::Paragraph);
        let para_id = para.id;
        let mut para_text = String::new();
        while idx < lines.len() && !lines[idx].is_empty() && !lines[idx].starts_with("\\") && !lines[idx].starts_with("$$") {
            para_text.push_str(lines[idx]);
            para_text.push(' ');
            idx += 1;
        }
        let inlines = parse_inlines(para_text.trim());
        for inline in inlines {
            para.append_child(inline.id);
            nodes.insert(inline.id, inline);
        }
        page.append_child(para_id);
        nodes.insert(para_id, para);
        if idx < lines.len() && lines[idx].is_empty() {
            idx += 1;
        }
    }
    
    root.append_child(page_id);
    nodes.insert(root_id, root);
    nodes.insert(page_id, page);
    
    Document::from_parts(nodes, root_id)
}

/// Convert formatting properties of inline node to LaTeX code
fn inline_to_latex(node: &Node, doc: &Document) -> String {
    let mut content = node.text.clone().unwrap_or_default();
    
    // If it's inline math, format with single $
    if let Some(PropertyValue::String(kind)) = node.get_property(&PropertyKey::InlineKind) {
        if kind == "math" {
            return format!("${}$", content);
        }
    }
    
    if node.get_property(&PropertyKey::Bold).and_then(|v| v.as_bool()).unwrap_or(false) {
        content = format!("\\textbf{{{}}}", content);
    }
    if node.get_property(&PropertyKey::Italic).and_then(|v| v.as_bool()).unwrap_or(false) {
        content = format!("\\textit{{{}}}", content);
    }
    if node.get_property(&PropertyKey::Underline).and_then(|v| v.as_bool()).unwrap_or(false) {
        content = format!("\\underline{{{}}}", content);
    }
    if node.get_property(&PropertyKey::Strikethrough).and_then(|v| v.as_bool()).unwrap_or(false) {
        content = format!("\\sout{{{}}}", content);
    }
    
    content
}

/// Convert block node children to LaTeX code
fn block_to_latex(node: &Node, doc: &Document) -> String {
    let mut out = String::new();
    let kind_str = match node.get_property(&PropertyKey::BlockKind) {
        Some(PropertyValue::String(k)) => k.clone(),
        _ => "".to_string(),
    };
    
    let inline_content = node.children.iter()
        .filter_map(|c| doc.get_node(&c.node_id))
        .map(|inline| inline_to_latex(inline, doc))
        .collect::<Vec<String>>()
        .join("");

    if kind_str == "Heading1" {
        out.push_str(&format!("\\section{{{}}}\n\n", inline_content));
    } else if kind_str == "Heading2" {
        out.push_str(&format!("\\subsection{{{}}}\n\n", inline_content));
    } else if kind_str == "Heading3" {
        out.push_str(&format!("\\subsubsection{{{}}}\n\n", inline_content));
    } else if kind_str == "Paragraph" {
        // If it contains a single math node, maybe it was a display math block
        let is_display_math = node.children.len() == 1 && node.children.iter().any(|c| {
            if let Some(child) = doc.get_node(&c.node_id) {
                if let Some(PropertyValue::String(kind)) = child.get_property(&PropertyKey::InlineKind) {
                    return kind == "math" && child.text.as_ref().map(|t| t.contains('\n') || t.len() > 15).unwrap_or(false);
                }
            }
            false
        });
        
        if is_display_math {
            let child = doc.get_node(&node.children[0].node_id).unwrap();
            out.push_str(&format!("$$\n{}\n$$\n\n", child.text.as_ref().unwrap_or(&"".to_string()).trim()));
        } else {
            out.push_str(&format!("{}\n\n", inline_content));
        }
    } else if kind_str == "BlockQuote" {
        out.push_str(&format!("\\begin{{quote}}\n{}\n\\end{{quote}}\n\n", inline_content));
    } else if kind_str == "UnorderedList" {
        out.push_str("\\begin{itemize}\n");
        for child_ref in &node.children {
            if let Some(item_node) = doc.get_node(&child_ref.node_id) {
                let item_content = item_node.children.iter()
                    .filter_map(|c| doc.get_node(&c.node_id))
                    .map(|inline| inline_to_latex(inline, doc))
                    .collect::<Vec<String>>()
                    .join("");
                out.push_str(&format!("  \\item {}\n", item_content));
            }
        }
        out.push_str("\\end{itemize}\n\n");
    } else if kind_str == "OrderedList" {
        out.push_str("\\begin{enumerate}\n");
        for child_ref in &node.children {
            if let Some(item_node) = doc.get_node(&child_ref.node_id) {
                let item_content = item_node.children.iter()
                    .filter_map(|c| doc.get_node(&c.node_id))
                    .map(|inline| inline_to_latex(inline, doc))
                    .collect::<Vec<String>>()
                    .join("");
                out.push_str(&format!("  \\item {}\n", item_content));
            }
        }
        out.push_str("\\end{enumerate}\n\n");
    }
    
    out
}

/// Convert Document to clean body-only LaTeX code (no preamble)
pub fn to_latex_body(doc: &Document) -> String {
    let mut out = String::new();
    let pages = doc.pages();
    for page in pages {
        for child_ref in &page.children {
            if let Some(block) = doc.get_node(&child_ref.node_id) {
                out.push_str(&block_to_latex(block, doc));
            }
        }
    }
    out.trim().to_string()
}

/// Convert Document to full LaTeX code with document skeleton
pub fn to_latex(doc: &Document) -> String {
    let body = to_latex_body(doc);
    format!(
        "\\documentclass{{article}}\n\\begin{{document}}\n\n{}\n\n\\end{{document}}",
        body
    )
}

/// Compile a single inline node properties to HTML tag string
fn inline_to_html(node: &Node, doc: &Document) -> String {
    let content = node.text.clone().unwrap_or_default();
    
    if let Some(PropertyValue::String(kind)) = node.get_property(&PropertyKey::InlineKind) {
        if kind == "math" {
            // Check if it should be displayed block style
            let is_block = content.contains('\n') || content.len() > 15;
            if is_block {
                return format!("$$\n{}\n$$", content);
            } else {
                return format!("${}$", content);
            }
        }
    }
    
    let mut open_tags = String::new();
    let mut close_tags = String::new();
    
    if node.get_property(&PropertyKey::Bold).and_then(|v| v.as_bool()).unwrap_or(false) {
        open_tags.push_str("<strong>");
        close_tags.insert_str(0, "</strong>");
    }
    if node.get_property(&PropertyKey::Italic).and_then(|v| v.as_bool()).unwrap_or(false) {
        open_tags.push_str("<em>");
        close_tags.insert_str(0, "</em>");
    }
    if node.get_property(&PropertyKey::Underline).and_then(|v| v.as_bool()).unwrap_or(false) {
        open_tags.push_str("<u>");
        close_tags.insert_str(0, "</u>");
    }
    if node.get_property(&PropertyKey::Strikethrough).and_then(|v| v.as_bool()).unwrap_or(false) {
        open_tags.push_str("<s>");
        close_tags.insert_str(0, "</s>");
    }
    
    format!("{}{}{}", open_tags, content, close_tags)
}

/// Compile a block node children to HTML tag string
fn block_to_html(node: &Node, doc: &Document) -> String {
    let mut out = String::new();
    let kind_str = match node.get_property(&PropertyKey::BlockKind) {
        Some(PropertyValue::String(k)) => k.clone(),
        _ => "".to_string(),
    };
    
    let inline_content = node.children.iter()
        .filter_map(|c| doc.get_node(&c.node_id))
        .map(|inline| inline_to_html(inline, doc))
        .collect::<Vec<String>>()
        .join("");

    if kind_str == "Heading1" {
        out.push_str(&format!("<h1>{}</h1>", inline_content));
    } else if kind_str == "Heading2" {
        out.push_str(&format!("<h2>{}</h2>", inline_content));
    } else if kind_str == "Heading3" {
        out.push_str(&format!("<h3>{}</h3>", inline_content));
    } else if kind_str == "Paragraph" {
        // If it's a display math block, wrap it in a display math center container
        let is_display_math = node.children.len() == 1 && node.children.iter().any(|c| {
            if let Some(child) = doc.get_node(&c.node_id) {
                if let Some(PropertyValue::String(kind)) = child.get_property(&PropertyKey::InlineKind) {
                    return kind == "math" && child.text.as_ref().map(|t| t.contains('\n') || t.len() > 15).unwrap_or(false);
                }
            }
            false
        });
        
        if is_display_math {
            out.push_str(&format!("<div class=\"math-block\">{}</div>", inline_content));
        } else {
            out.push_str(&format!("<p>{}</p>", inline_content));
        }
    } else if kind_str == "BlockQuote" {
        out.push_str(&format!("<blockquote>{}</blockquote>", inline_content));
    } else if kind_str == "UnorderedList" {
        out.push_str("<ul>");
        for child_ref in &node.children {
            if let Some(item_node) = doc.get_node(&child_ref.node_id) {
                let item_content = item_node.children.iter()
                    .filter_map(|c| doc.get_node(&c.node_id))
                    .map(|inline| inline_to_html(inline, doc))
                    .collect::<Vec<String>>()
                    .join("");
                out.push_str(&format!("<li>{}</li>", item_content));
            }
        }
        out.push_str("</ul>");
    } else if kind_str == "OrderedList" {
        out.push_str("<ol>");
        for child_ref in &node.children {
            if let Some(item_node) = doc.get_node(&child_ref.node_id) {
                let item_content = item_node.children.iter()
                    .filter_map(|c| doc.get_node(&c.node_id))
                    .map(|inline| inline_to_html(inline, doc))
                    .collect::<Vec<String>>()
                    .join("");
                out.push_str(&format!("<li>{}</li>", item_content));
            }
        }
        out.push_str("</ol>");
    }
    
    out
}

/// Serialize the entire Document into compiled HTML blocks for page display
pub fn to_html(doc: &Document) -> String {
    let mut out = String::new();
    let pages = doc.pages();
    for page in pages {
        for child_ref in &page.children {
            if let Some(block) = doc.get_node(&child_ref.node_id) {
                out.push_str(&block_to_html(block, doc));
            }
        }
    }
    out
}

#[derive(Debug, Clone, PartialEq, Eq)]
enum HtmlToken {
    TagOpen(String, Vec<String>), // (tag_name, classes)
    TagClose(String),             // tag_name
    Text(String),
}

fn tokenize_html(html: &str) -> Vec<HtmlToken> {
    let mut tokens = Vec::new();
    let chars: Vec<char> = html.chars().collect();
    let mut i = 0;
    
    while i < chars.len() {
        if chars[i] == '<' {
            i += 1;
            let mut tag_content = String::new();
            while i < chars.len() && chars[i] != '>' {
                tag_content.push(chars[i]);
                i += 1;
            }
            if i < chars.len() {
                i += 1; // skip '>'
            }
            
            let trimmed = tag_content.trim();
            if trimmed.starts_with('/') {
                let tag_name = trimmed[1..].trim().to_lowercase();
                tokens.push(HtmlToken::TagClose(tag_name));
            } else {
                let self_closing = trimmed.ends_with('/');
                let tag_body = if self_closing {
                    trimmed[..trimmed.len()-1].trim()
                } else {
                    trimmed
                };
                
                let mut parts = tag_body.split_whitespace();
                if let Some(tag_name) = parts.next() {
                    let tag_name_lower = tag_name.to_lowercase();
                    let mut classes = Vec::new();
                    
                    for attr in parts {
                        if attr.starts_with("class=") {
                            let class_val = attr.split('=').nth(1).unwrap_or("").trim_matches(|c| c == '"' || c == '\'');
                            classes = class_val.split_whitespace().map(|s| s.to_string()).collect();
                        }
                    }
                    
                    tokens.push(HtmlToken::TagOpen(tag_name_lower.clone(), classes));
                    if self_closing {
                        tokens.push(HtmlToken::TagClose(tag_name_lower));
                    }
                }
            }
        } else {
            let mut text = String::new();
            while i < chars.len() && chars[i] != '<' {
                text.push(chars[i]);
                i += 1;
            }
            if !text.is_empty() {
                let decoded = text.replace("&nbsp;", " ")
                    .replace("&lt;", "<")
                    .replace("&gt;", ">")
                    .replace("&amp;", "&");
                tokens.push(HtmlToken::Text(decoded));
            }
        }
    }
    tokens
}

/// Parse HTML elements directly into AST tree
pub fn parse_html(html: &str) -> Document {
    let mut root = Node::new(NodeType::Document);
    let root_id = root.id;
    let mut page = Node::new(NodeType::Page);
    let page_id = page.id;
    
    let mut nodes: HashMap<NodeId, Node> = HashMap::new();
    let tokens = tokenize_html(html);
    
    let mut active_block: Option<Node> = None;
    let mut active_list: Option<Node> = None;
    
    let mut is_bold = false;
    let mut is_italic = false;
    let mut is_underline = false;
    let mut is_strikethrough = false;
    
    let mut ignore_depth = 0;
    let mut capture_math = false;
    let mut math_content = String::new();
    
    for token in tokens {
        match token {
            HtmlToken::TagOpen(tag, classes) => {
                if tag == "annotation" {
                    capture_math = true;
                    math_content.clear();
                } else if tag == "span" && (classes.contains(&"katex".to_string()) || classes.contains(&"katex-mathml".to_string()) || classes.contains(&"katex-html".to_string())) {
                    ignore_depth += 1;
                } else if tag == "math" || tag == "semantics" || tag == "mrow" || tag == "mi" || tag == "mo" || tag == "mn" || tag == "mtext" || tag == "ms" || tag == "mspace" || tag == "mglyph" {
                    ignore_depth += 1;
                } else if ignore_depth == 0 {
                    if tag == "h1" || tag == "h2" || tag == "h3" || tag == "p" || tag == "blockquote" || tag == "div" {
                        if let Some(block) = active_block.take() {
                            let b_id = block.id;
                            if let Some(ref mut lst) = active_list {
                                if block.get_property(&PropertyKey::BlockKind) == Some(&PropertyValue::String("ListItem".to_string())) {
                                    lst.append_child(b_id);
                                } else {
                                    page.append_child(b_id);
                                }
                            } else {
                                page.append_child(b_id);
                            }
                            nodes.insert(b_id, block);
                        }
                        
                        let kind = match tag.as_str() {
                            "h1" => BlockKind::Heading1,
                            "h2" => BlockKind::Heading2,
                            "h3" => BlockKind::Heading3,
                            "blockquote" => BlockKind::BlockQuote,
                            _ => BlockKind::Paragraph,
                        };
                        
                        let mut new_block = Node::block(kind);
                        // If it is a display math-block div, we can set up formatting logic or leave as is
                        active_block = Some(new_block);
                    } else if tag == "ul" || tag == "ol" {
                        if let Some(lst) = active_list.take() {
                            let l_id = lst.id;
                            page.append_child(l_id);
                            nodes.insert(l_id, lst);
                        }
                        let kind = if tag == "ul" { BlockKind::UnorderedList } else { BlockKind::OrderedList };
                        active_list = Some(Node::block(kind));
                    } else if tag == "li" {
                        if let Some(block) = active_block.take() {
                            let b_id = block.id;
                            if let Some(ref mut lst) = active_list {
                                lst.append_child(b_id);
                            } else {
                                page.append_child(b_id);
                            }
                            nodes.insert(b_id, block);
                        }
                        active_block = Some(Node::block(BlockKind::ListItem));
                    } else if tag == "strong" || tag == "b" {
                        is_bold = true;
                    } else if tag == "em" || tag == "i" {
                        is_italic = true;
                    } else if tag == "u" {
                        is_underline = true;
                    } else if tag == "s" || tag == "strike" || tag == "del" {
                        is_strikethrough = true;
                    }
                } else {
                    // We are in an ignored tag block, nested open counts towards ignore depth
                    ignore_depth += 1;
                }
            }
            HtmlToken::TagClose(tag) => {
                if tag == "annotation" {
                    capture_math = false;
                    // Build math inline node
                    let mut math_node = Node::new(NodeType::Inline);
                    math_node.set_property(PropertyKey::InlineKind, PropertyValue::String("math".to_string()));
                    math_node.text = Some(math_content.trim().to_string());
                    
                    let inline_id = math_node.id;
                    nodes.insert(inline_id, math_node);
                    
                    if active_block.is_none() {
                        active_block = Some(Node::block(BlockKind::Paragraph));
                    }
                    if let Some(ref mut block) = active_block {
                        block.append_child(inline_id);
                    }
                } else if tag == "span" || tag == "math" || tag == "semantics" || tag == "mrow" || tag == "mi" || tag == "mo" || tag == "mn" || tag == "mtext" || tag == "ms" || tag == "mspace" || tag == "mglyph" {
                    if ignore_depth > 0 {
                        ignore_depth -= 1;
                    }
                } else if ignore_depth == 0 {
                    if tag == "h1" || tag == "h2" || tag == "h3" || tag == "p" || tag == "blockquote" || tag == "div" || tag == "li" {
                        if let Some(block) = active_block.take() {
                            let b_id = block.id;
                            if let Some(ref mut lst) = active_list {
                                if block.get_property(&PropertyKey::BlockKind) == Some(&PropertyValue::String("ListItem".to_string())) {
                                    lst.append_child(b_id);
                                } else {
                                    page.append_child(b_id);
                                }
                            } else {
                                page.append_child(b_id);
                            }
                            nodes.insert(b_id, block);
                        }
                    } else if tag == "ul" || tag == "ol" {
                        if let Some(lst) = active_list.take() {
                            let l_id = lst.id;
                            page.append_child(l_id);
                            nodes.insert(l_id, lst);
                        }
                    } else if tag == "strong" || tag == "b" {
                        is_bold = false;
                    } else if tag == "em" || tag == "i" {
                        is_italic = false;
                    } else if tag == "u" {
                        is_underline = false;
                    } else if tag == "s" || tag == "strike" || tag == "del" {
                        is_strikethrough = false;
                    }
                } else {
                    ignore_depth -= 1;
                }
            }
            HtmlToken::Text(text) => {
                if capture_math {
                    math_content.push_str(&text);
                } else if ignore_depth == 0 {
                    if text.trim().is_empty() && active_block.is_none() {
                        continue;
                    }
                    if active_block.is_none() {
                        active_block = Some(Node::block(BlockKind::Paragraph));
                    }
                    
                    let inlines = parse_inlines(&text);
                    for mut inline in inlines {
                        // Apply inherited inline properties
                        if is_bold {
                            inline.set_property(PropertyKey::Bold, PropertyValue::Bool(true));
                        }
                        if is_italic {
                            inline.set_property(PropertyKey::Italic, PropertyValue::Bool(true));
                        }
                        if is_underline {
                            inline.set_property(PropertyKey::Underline, PropertyValue::Bool(true));
                        }
                        if is_strikethrough {
                            inline.set_property(PropertyKey::Strikethrough, PropertyValue::Bool(true));
                        }
                        
                        let inline_id = inline.id;
                        nodes.insert(inline_id, inline);
                        if let Some(ref mut block) = active_block {
                            block.append_child(inline_id);
                        }
                    }
                }
            }
        }
    }
    
    if let Some(block) = active_block {
        let b_id = block.id;
        if let Some(ref mut lst) = active_list {
            if block.get_property(&PropertyKey::BlockKind) == Some(&PropertyValue::String("ListItem".to_string())) {
                lst.append_child(b_id);
            } else {
                page.append_child(b_id);
            }
        } else {
            page.append_child(b_id);
        }
        nodes.insert(b_id, block);
    }
    if let Some(lst) = active_list {
        let l_id = lst.id;
        page.append_child(l_id);
        nodes.insert(l_id, lst);
    }
    
    root.append_child(page_id);
    nodes.insert(root_id, root);
    nodes.insert(page_id, page);
    
    Document::from_parts(nodes, root_id)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_html_basic() {
        let html = "<h1>Title</h1><p>This is <strong>bold</strong> and <em>italic</em>.</p>";
        let doc = parse_html(html);
        let latex = to_latex_body(&doc);
        assert_eq!(latex, "\\section{Title}\n\nThis is \\textbf{bold} and \\textit{italic}.");
    }

    #[test]
    fn test_parse_html_katex() {
        let html = "<p>Equation is <span class=\"katex\"><span class=\"katex-mathml\"><math><semantics><annotation encoding=\"application/x-tex\">E=mc^2</annotation></semantics></math></span></span> inline.</p>";
        let doc = parse_html(html);
        let latex = to_latex_body(&doc);
        assert_eq!(latex, "Equation is $E=mc^2$ inline.");
    }
}
