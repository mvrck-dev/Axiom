# Typewerx Axiom

**A document operating system built for intent, not manual layout.**

---

## The Problem

The modern document is deeply dependent on the editor that created it. Traditional WYSIWYG editors force writers to act as layout engineers. Changing a font size, adjusting a margin, or simply moving an image can unexpectedly shatter an entire document's structure. 

Documents in the current status quo are fragile. They rely on brittle visual formatting rather than underlying semantic meaning. This creates a paradigm where:
* The writing process is constantly interrupted by formatting struggles.
* Documents are locked into the specific application used to create them (vendor lock-in).
* Professional typesetting (e.g., LaTeX) remains inaccessible to the average user due to steep learning curves.

## The Solution: A Document Operating System

Axiom is not just another text editor; it is a **Document Operating System**. It is built on the philosophy that a document editor should disappear during the writing process.

Instead of directly manipulating visual layouts, Axiom relies on a **semantic intermediate representation (IR)**. Writers express *intent* (e.g., "This is a primary heading," "These two images belong side-by-side"), and the underlying engine automatically calculates the optimal layout and typesetting. 

By decoupling the writing process from the layout engine, Axiom ensures that documents are robust, portable, and beautifully typeset without requiring a single line of formatting code.

### Core Tenets
- **Intent Over Formatting:** Writers declare what a component is, not where it goes.
- **Robust Layouts:** Smart algorithms (like auto-framing for multi-image grids) handle complex layouts natively.
- **True Portability:** Documents exist independently of the application interface.
- **High-Fidelity Output:** Capable of generating production-ready LaTeX directly from the semantic IR.

---

## Architecture

Axiom utilizes a decoupled architecture designed for high performance and portability:

- **`engine/` (Rust):** The core semantic parser, state manager, and typesetting engine. Written in Rust for memory safety and high-performance layout calculations, compiled to WebAssembly (WASM).
- **`shell/` (TypeScript / Vite):** The user interface and interaction layer. A lightweight web frontend that communicates with the Rust engine to render the editing canvas and manage user input.

---

## Project Status

**Current State: MVP (Minimum Viable Product)**

Axiom is currently in active development at the MVP stage. The core bridge between the Rust engine and the TypeScript shell is operational, and development is heavily focused on stabilizing the semantic AST (Abstract Syntax Tree) and core layout algorithms.

### What is currently implemented:
- Basic ingestion and parsing of document nodes into the semantic IR.
- The Rust/WASM boundary and state synchronization with the TypeScript shell.
- Foundational block-level layout calculation.

### Current Goals:
1. **Stabilize the Intermediate Representation:** Finalize the schema for document storage, serialization, and versioning.
2. **Smart Media Tiling:** Implement the core algorithm for Figma-style auto-framing of multi-image layouts.
3. **LaTeX Export Pipeline:** Build the translation layer that converts the semantic IR directly into compilable `.tex` files.
4. **Editor Shell Refinement:** Implement the floating toolbars, radial menus, and command palettes required for a frictionless user experience.

### Known Issues
- The layout recalculation tree currently triggers unnecessary reflows during deep document mutations.
- Serialization overhead across the WASM bridge requires optimization for very large documents.
- Floating UI element positioning occasionally fails on complex viewport edge cases.

---

## Contributing

Axiom is an open-source initiative aimed at fixing a fundamentally broken status quo in document creation. We are actively seeking engineers and designers passionate about:
- **Rust:** AST parsing, WASM optimization, and typesetting algorithms.
- **Web Tech:** Rendering performance, rich text state management, and modern UI.
- **Design:** Rethinking the UX of complex document workflows.

*Detailed contribution guidelines, local setup instructions, and the development roadmap will be published as the core engine API stabilizes.*

---

## License

Typewerx Axiom is licensed under the **GNU Affero General Public License v3.0 (AGPLv3)**.

Because Axiom acts as a networked document engine (especially given its web shell/WASM integration), the AGPL ensures that any modifications made to the engine that are provided over a network must also be released as open source. This guarantees that Axiom remains a community-driven, truly open document operating system.

See the [LICENSE](./LICENSE) file for the full text.
