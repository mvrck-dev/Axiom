import { AxiomEngine } from '@engine/axiom_bridge';

/**
 * Organised API Client Ecosystem wrapping the compiled Rust WASM engine.
 * Provides a clean interface for interacting with document states, nodes, and debugging tools.
 */
class EngineService {
  private engines: Map<string, AxiomEngine> = new Map();

  /**
   * Get or create a Rust engine instance for a specific document.
   */
  public getOrCreateInstance(docId: string): AxiomEngine {
    if (!this.engines.has(docId)) {
      console.log(`[API Client] Initializing new Rust engine instance for document: ${docId}`);
      this.engines.set(docId, new AxiomEngine());
    }
    return this.engines.get(docId)!;
  }

  /**
   * Get the version details of the Rust engine.
   */
  public getEngineVersion(docId: string): string {
    const engine = this.getOrCreateInstance(docId);
    return engine.version();
  }

  /**
   * Get total number of nodes in the document state.
   */
  public getNodeCount(docId: string): number {
    const engine = this.getOrCreateInstance(docId);
    return engine.nodeCount();
  }

  /**
   * Get total number of pages in the document.
   */
  public getPageCount(docId: string): number {
    const engine = this.getOrCreateInstance(docId);
    return engine.pageCount();
  }

  /**
   * Insert a paragraph node containing text. Returns the created node ID.
   */
  public insertParagraph(docId: string, text: string): string {
    const engine = this.getOrCreateInstance(docId);
    return engine.insertParagraph(text);
  }

  /**
   * Format a specific node with styling properties (e.g. bold, italic).
   */
  public formatNode(docId: string, nodeId: string, property: string, value: boolean): boolean {
    const engine = this.getOrCreateInstance(docId);
    return engine.formatNode(nodeId, property, value);
  }

  /**
   * Serialize the internal document tree into a structured JSON outline.
   */
  public getDocumentTreeJSON(docId: string): string {
    const engine = this.getOrCreateInstance(docId);
    return engine.toJSON();
  }

  /**
   * Parse raw LaTeX and sync engine document state. Returns the JSON AST.
   */
  public parseLaTeX(docId: string, code: string): string {
    const engine = this.getOrCreateInstance(docId);
    return engine.parseLaTeX(code);
  }

  /**
   * Parse HTML and sync engine document state. Returns the JSON AST.
   */
  public parseHTML(docId: string, html: string): string {
    const engine = this.getOrCreateInstance(docId);
    return engine.parseHTML(html);
  }

  /**
   * Export the active document state as raw LaTeX code.
   */
  public toLaTeX(docId: string): string {
    const engine = this.getOrCreateInstance(docId);
    return engine.toLaTeX();
  }

  /**
   * Compile the active document state into HTML string.
   */
  public toHTML(docId: string): string {
    const engine = this.getOrCreateInstance(docId);
    return engine.toHTML();
  }

  /**
   * Export the active document as body-only LaTeX (no preamble).
   */
  public toLaTeXBody(docId: string): string {
    const engine = this.getOrCreateInstance(docId);
    return engine.toLaTeXBody();
  }

  /**
   * Remove a document engine instance to free up memory when a document is closed/deleted.
   */
  public destroyInstance(docId: string): void {
    const engine = this.engines.get(docId);
    if (engine) {
      engine.free();
      this.engines.delete(docId);
      console.log(`[API Client] Destroyed Rust engine instance for document: ${docId}`);
    }
  }
}

export const engineService = new EngineService();
