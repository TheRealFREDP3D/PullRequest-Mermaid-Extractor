### Mermaid PR Extractor (v0.1.0 Prototype) Briefing Document

#### Executive Summary

The  **Mermaid PR Extractor (v0.1.0 Prototype)**  is a specialized, browser-based tool designed to identify, visualize, and export Mermaid diagrams embedded within GitHub Pull Request (PR) descriptions and comments. Operating entirely on the client side, the tool bridges the gap between GitHub’s text-centric discussion environment and visual system architecture.As of January 2026, the prototype offers automated diagram discovery via a regex-based extraction pipeline, a robust cleaning utility to prevent rendering failures, and multiple visual themes. However, the current version is subject to significant architectural constraints, including a 30-PR scan limit due to a lack of API pagination and a lack of data caching, which increases the risk of hitting GitHub API rate limits.

#### Technical Architecture and Stack

The application is built using a modern, client-side technical stack optimized for performance and ease of deployment without the need for backend infrastructure.

##### Core Technologies

Category,Technology,Purpose  
Framework,React 19,UI development and component-based architecture.  
Language,TypeScript,"Type safety and maintainability (e.g., Diagram, GitHubPR interfaces)."  
Build Tool,Vite,Fast development server and build processing.  
Styling,Tailwind CSS,"Layout design, card previews, and theme support."  
Icons,Lucide Icons,Visual status indicators and UI cues.  
Rendering,Mermaid.js v10,Conversion of raw text into SVG visualizations.

##### System Design

The tool is strictly  **client-side** , meaning all data processing, extraction, and rendering occur within the user's browser. This architecture avoids the complexity of a backend but introduces specific trade-offs regarding data persistence and API management.

#### The Extraction and Processing Pipeline

The core value of the tool lies in its specialized workflow for transforming raw GitHub data into structured visual objects.

##### 1\. Discovery and Retrieval

The tool utilizes a linear, event-driven workflow:

* **Authentication:**  Users can operate in "Demo Mode" using sample diagrams or "Real Data Mode" by providing a GitHub Classic Personal Access Token (PAT).  
* **Scanning:**  The system fetches the  **last 30 PRs**  from a specified repository.  
* **Targeting:**  It scans both the primary  **PR description**  and  **all associated comments**  for Mermaid code blocks using the MERMAID\_REGEX (/\`\`\`mermaid/).

##### 2\. Business Logic: cleanMermaidCode

To ensure the Mermaid.js renderer does not crash, the application passes all extracted text through a specialized cleaning utility. This utility performs four critical functions:

* **Line Ending Normalization:**  Standardizes Windows (\\r\\n) or Mac (\\r) breaks to Unix-style (\\n).  
* **HTML Entity Decoding:**  Converts characters returned by the GitHub API (e.g., , , , ) back into standard symbols.  
* **Syntax Correction:**  Automatically identifies unquoted pipe characters (|) within node labels (e.g., label|text) and wraps them in quotes (e.g., "label|text") to maintain syntax integrity.  
* **Trimming:**  Removes leading and trailing whitespace captured during extraction.

##### 3\. Data Modeling

Every extracted diagram is stored as a Diagram object containing:

* **Metadata:**  PR title, number, state (open, closed, or merged), URL, and author (including avatar).  
* **Cleaned Code:**  The sanitized Mermaid syntax.  
* **Source Details:**  Whether the diagram originated from a description or a comment, including a unique composite ID for sorting.

#### Visualization and User Interface

The tool provides a tiered interface to manage and view discovered diagrams.

* **DiagramCard Grid:**  A "beautiful" grid of cards displaying small previews of diagrams, metadata, and status icons.  
* **DiagramModal:**  A full-screen view triggered by clicking a card. It offers a large-scale SVG rendering, access to the underlying code (on desktop), and export utilities.  
* **Themes:**  Users can switch between multiple visual styles, including GitHub Dark, GitHub Light, Monokai, and Dracula.

#### Export Protocols

The prototype supports two primary export formats located within the DiagramModal:

1. **Markdown (.md):**  Downloads the diagram as a Markdown file.  
2. **Draw.io XML (.drawio):**  A basic implementation that embeds the diagram text into an XML format compatible with Draw.io.

#### Known Limitations and Architectural Constraints

As a v0.1.0 prototype, several "Known Issues" impact the tool's performance and scope:

* **API Pagination Limitations:**  The tool is currently restricted to scanning the  **last 30 Pull Requests** . This is because API pagination logic has not yet been implemented, preventing access to historical data beyond the initial API batch.  
* **No Data Caching:**  There is no local storage or caching mechanism. Every repository scan triggers fresh GitHub API calls for both PR bodies and comments.  
* **Rate Limiting Risks:**  Because every session requires fresh API calls and scans both descriptions and comments, users may reach GitHub API rate limits quickly. This is a particular concern for large, active repositories with high comment volumes.  
* **Basic Exports:**  The Draw.io export is currently a "basic implementation" that focuses on text embedding rather than advanced visual mapping.

