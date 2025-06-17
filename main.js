class WebsiteBuilder {
  /**
   * Initializes the WebsiteBuilder application.
   * Sets up the selected element, element counter, and calls the init method.
   */
  constructor() {
    this.selectedElement = null; // Stores the currently selected element on the canvas
    this.elementCounter = 0; // Counter for unique element IDs
    this.init();
  }

  /**
   * Initializes the UI and attaches all necessary event listeners.
   */
  init() {
    this.createUI();
    this.attachEventListeners();
  }

  /**
   * Creates the main user interface structure for the website builder.
   * This includes the toolbar, canvas, and properties panel, injecting it into the 'root' div.
   */
  createUI() {
    const root = document.getElementById("root");
    root.innerHTML = `
    <div class="builder-container">
      
      
      <!-- Toolbar for draggable elements and actions -->
      <div class="toolbar" id="toolbar">
        <h2 class="toolbar-title">Elements</h2>
        <div class="element-group">
          <!-- Draggable Heading element -->
          <div class="draggable-element" draggable="true" data-type="heading">
            <div class="element-icon">H</div>
            <span>Heading</span>
          </div>
          <!-- Draggable Image element -->
          <div class="draggable-element" draggable="true" data-type="image">
            <div class="element-icon">🖼️</div>
            <span>Image</span>
          </div>
          <!-- Draggable Button element -->
          <div class="draggable-element" draggable="true" data-type="button">
            <div class="element-icon">▢</div>
            <span>Button</span>
          </div>
        </div>
        <!-- Toolbar action buttons -->
        <div class="toolbar-actions">
          <button id="preview-btn" class="toolbar-btn">Preview</button>
          <button id="export-btn" class="toolbar-btn">Export HTML</button>
        </div>
      </div>

      <!-- Canvas area where elements are dropped and arranged -->
      <div class="canvas-container">
        <div id="canvas" class="canvas">
          <div class="canvas-placeholder">
            <h3>Drag elements here to start building</h3>
            <p>Select any element on the canvas to edit its properties</p>
          </div>
        </div>
      </div>

      <!-- Properties Panel for editing selected element's attributes -->
      <div class="properties-panel" id="properties-panel">
        <div class="properties-header">
          <h2 class="panel-title">Properties</h2>
          
        </div>
        <div id="properties-content" class="properties-content">
          <p class="no-selection">Select an element to edit its properties</p>
        </div>
      </div>
      
      <!-- Mobile overlay -->
      <div class="mobile-overlay" id="mobile-overlay"></div>
    </div>
  `;
  }

  /**
   * Attaches all global event listeners for drag-and-drop, canvas clicks, and buttons.
   */
  attachEventListeners() {
    const canvas = document.getElementById("canvas");
    const previewBtn = document.getElementById("preview-btn");
    const exportBtn = document.getElementById("export-btn");

    // NEW: Mobile menu toggle functionality
    const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
    const toolbar = document.getElementById("toolbar");
    const mobileOverlay = document.getElementById("mobile-overlay");
    const propertiesClose = document.getElementById("properties-close");
    const propertiesPanel = document.getElementById("properties-panel");

    // Mobile menu toggle
    if (mobileMenuToggle) {
      mobileMenuToggle.addEventListener("click", () => {
        toolbar.classList.toggle("mobile-open");
        mobileOverlay.classList.toggle("active");
        document.body.classList.toggle("menu-open");
      });
    }

    // Close mobile menu when overlay is clicked
    if (mobileOverlay) {
      mobileOverlay.addEventListener("click", () => {
        toolbar.classList.remove("mobile-open");
        mobileOverlay.classList.remove("active");
        propertiesPanel.classList.remove("mobile-open");
        document.body.classList.remove("menu-open");
      });
    }

    // Properties panel close button (mobile)
    if (propertiesClose) {
      propertiesClose.addEventListener("click", () => {
        propertiesPanel.classList.remove("mobile-open");
        mobileOverlay.classList.remove("active");
        document.body.classList.remove("menu-open");
      });
    }

    // Event listeners for draggable elements in the toolbar
    document.querySelectorAll(".draggable-element").forEach((element) => {
      element.addEventListener("dragstart", this.handleDragStart.bind(this));

      // NEW: Add touch events for mobile drag and drop
      element.addEventListener("touchstart", this.handleTouchStart.bind(this), {
        passive: false,
      });
      element.addEventListener("touchmove", this.handleTouchMove.bind(this), {
        passive: false,
      });
      element.addEventListener("touchend", this.handleTouchEnd.bind(this), {
        passive: false,
      });
    });

    // Event listeners for the canvas to handle dropping elements
    canvas.addEventListener("dragover", this.handleDragOver.bind(this));
    canvas.addEventListener("drop", this.handleDrop.bind(this));
    canvas.addEventListener("dragleave", this.handleDragLeave.bind(this));

    // Event listener for clicks on the canvas to select/deselect elements
    canvas.addEventListener("click", this.handleCanvasClick.bind(this));

    // Event listeners for the Preview and Export buttons
    previewBtn.addEventListener("click", this.togglePreview.bind(this));
    exportBtn.addEventListener("click", this.exportHTML.bind(this));

    // NEW: Handle window resize
    window.addEventListener("resize", this.handleResize.bind(this));
  }

  handleTouchStart(e) {
    this.touchItem = e.target.closest(".draggable-element");
    this.touchStartPos = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };

    if (this.touchItem) {
      this.touchItem.style.opacity = "0.7";
      e.preventDefault();
    }
  }

  handleTouchMove(e) {
    if (!this.touchItem) return;

    e.preventDefault();
    const touch = e.touches[0];
    const elementBelow = document.elementFromPoint(
      touch.clientX,
      touch.clientY
    );

    // Visual feedback for drop zones
    const canvas = document.getElementById("canvas");
    if (canvas.contains(elementBelow) || elementBelow === canvas) {
      canvas.classList.add("drag-over");
      // Add visual feedback to touch item
      this.touchItem.style.transform = "scale(0.95)";
    } else {
      canvas.classList.remove("drag-over");
      this.touchItem.style.transform = "scale(1)";
    }
  }

  handleTouchEnd(e) {
    if (!this.touchItem) return;

    const touch = e.changedTouches[0];
    const elementBelow = document.elementFromPoint(
      touch.clientX,
      touch.clientY
    );
    const canvas = document.getElementById("canvas");

    // Check if dropped on canvas
    if (canvas.contains(elementBelow) || elementBelow === canvas) {
      const elementType = this.touchItem.dataset.type;
      this.createElement(elementType);

      // Close mobile toolbar after adding element
      if (window.innerWidth <= 768) {
        const toolbar = document.getElementById("toolbar");
        const mobileOverlay = document.getElementById("mobile-overlay");
        toolbar.classList.remove("mobile-open");
        mobileOverlay.classList.remove("active");
        document.body.classList.remove("menu-open");
      }
    }

    // Reset styles
    canvas.classList.remove("drag-over");
    if (this.touchItem) {
      this.touchItem.style.opacity = "";
    }
    this.touchItem = null;
    this.touchStartPos = null;
  }
  /**
   * Handles the 'dragstart' event for draggable elements.
   * Sets the data-type of the dragged element to be transferred.
   * @param {Event} e - The dragstart event object.
   */
  handleDragStart(e) {
    e.dataTransfer.setData("text/plain", e.target.dataset.type);
  }

  /**
   * Handles the 'dragover' event for the canvas.
   * Prevents default to allow dropping and adds a visual 'drag-over' class.
   * @param {Event} e - The dragover event object.
   */
  handleDragOver(e) {
    e.preventDefault(); // Necessary to allow dropping
    e.currentTarget.classList.add("drag-over");
  }

  /**
   * Handles the 'dragleave' event for the canvas.
   * Removes the visual 'drag-over' class.
   * @param {Event} e - The dragleave event object.
   */
  handleDragLeave(e) {
    e.currentTarget.classList.remove("drag-over");
  }

  /**
   * Handles the 'drop' event for the canvas.
   * Removes the 'drag-over' class and creates a new element based on the dropped type.
   * @param {Event} e - The drop event object.
   */
  handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");

    const elementType = e.dataTransfer.getData("text/plain");
    this.createElement(elementType);
  }

  handleResize() {
    // Close mobile panels on resize to desktop
    if (window.innerWidth > 768) {
      const toolbar = document.getElementById("toolbar");
      const propertiesPanel = document.getElementById("properties-panel");
      const mobileOverlay = document.getElementById("mobile-overlay");

      toolbar.classList.remove("mobile-open");
      propertiesPanel.classList.remove("mobile-open");
      mobileOverlay.classList.remove("active");
      document.body.classList.remove("menu-open");
    }
  }

  closeMobilePanels() {
    if (window.innerWidth <= 768) {
      const toolbar = document.getElementById("toolbar");
      const propertiesPanel = document.getElementById("properties-panel");
      const mobileOverlay = document.getElementById("mobile-overlay");

      toolbar.classList.remove("mobile-open");
      propertiesPanel.classList.remove("mobile-open");
      mobileOverlay.classList.remove("active");
      document.body.classList.remove("menu-open");
    }
  }
  /**
   * Creates a new element on the canvas based on the specified type.
   * Removes the placeholder if it exists and attaches a delete button.
   * @param {string} type - The type of element to create (e.g., 'heading', 'image', 'button').
   */
  createElement(type) {
    const canvas = document.getElementById("canvas");
    const placeholder = canvas.querySelector(".canvas-placeholder");
    if (placeholder) placeholder.remove(); // Remove placeholder once an element is added

    this.elementCounter++;
    const elementId = `element-${this.elementCounter}`;

    const wrapper = document.createElement("div");
    wrapper.className = "dropped-element";
    wrapper.dataset.id = elementId;
    wrapper.dataset.type = type;

    let elementHTML = "";
    switch (type) {
      case "heading":
        elementHTML = `
                    <h2 class="dropped-heading">Your Heading Here</h2>
                    <button class="delete-btn">×</button>
                `;
        break;
      case "image":
        elementHTML = `
                    <img class="dropped-image" src="https://via.placeholder.com/300x200/667eea/white?text=Your+Image" alt="Placeholder">
                    <button class="delete-btn">×</button>
                `;
        break;
      case "button":
        elementHTML = `
                    <button class="dropped-button">Click Me</button>
                    <button class="delete-btn">×</button>
                `;
        break;
      default:
        // Handle unknown types or add more element types here
        elementHTML = `<p>Unknown element type: ${type}</p>`;
        break;
    }

    wrapper.innerHTML = elementHTML;
    canvas.appendChild(wrapper);

    // Add delete functionality to the dynamically created delete button
    const deleteBtn = wrapper.querySelector(".delete-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent the click from selecting the parent element
        wrapper.remove(); // Remove the element from the DOM
        // If the deleted element was selected, clear selection and update panel
        if (this.selectedElement === wrapper) {
          this.selectedElement = null;
          this.updatePropertiesPanel();
        }
        // If no elements are left, bring back the placeholder
        if (canvas.children.length === 0) {
          canvas.innerHTML = `
                        <div class="canvas-placeholder">
                            <h3>Drag elements here to start building</h3>
                            <p>Select any element on the canvas to edit its properties</p>
                        </div>
                    `;
        }
      });
    }
  }

  /**
   * Handles clicks on the canvas to select or deselect elements.
   * Applies/removes a 'selected' class and updates the properties panel.
   * @param {Event} e - The click event object.
   */
  handleCanvasClick(e) {
    // Find the closest parent element with the 'dropped-element' class
    const element = e.target.closest(".dropped-element");

    // Remove 'selected' class from all previously selected elements
    document.querySelectorAll(".dropped-element").forEach((el) => {
      el.classList.remove("selected");
    });

    if (element) {
      // Select the clicked element
      element.classList.add("selected");
      this.selectedElement = element;
      this.updatePropertiesPanel(); // Update panel for the new selection

      // NEW: Open properties panel on mobile when element is selected
      if (window.innerWidth <= 768) {
        const propertiesPanel = document.getElementById("properties-panel");
        const mobileOverlay = document.getElementById("mobile-overlay");
        propertiesPanel.classList.add("mobile-open");
        mobileOverlay.classList.add("active");
        document.body.classList.add("menu-open");
      }
    } else {
      // If no element was clicked (e.g., clicked on canvas background), deselect all
      this.selectedElement = null;
      this.updatePropertiesPanel(); // Clear properties panel
    }
  }

  /**
   * Updates the properties panel based on the currently selected element.
   * Populates inputs with current values and sets up property change listeners.
   */
  updatePropertiesPanel() {
    const propertiesContent = document.getElementById("properties-content");

    // Display placeholder text if no element is selected
    if (!this.selectedElement) {
      propertiesContent.innerHTML =
        '<p class="no-selection">Select an element to edit its properties</p>';
      return;
    }

    const elementType = this.selectedElement.dataset.type;
    let propertiesHTML = "";

    // Generate properties HTML based on element type
    switch (elementType) {
      case "heading":
        const heading = this.selectedElement.querySelector(".dropped-heading");
        propertiesHTML = `
                    <div class="property-group">
                        <label class="property-label" for="heading-text">Text Content</label>
                        <input type="text" class="property-input" id="heading-text" value="${
                          heading.textContent
                        }">
                    </div>
                    <div class="property-group">
                        <label class="property-label" for="heading-size">Font Size</label>
                        <select class="property-input" id="heading-size">
                            <option value="1.5rem" ${
                              heading.style.fontSize === "1.5rem"
                                ? "selected"
                                : ""
                            }>Small</option>
                            <option value="2rem" ${
                              !heading.style.fontSize ||
                              heading.style.fontSize === "2rem"
                                ? "selected"
                                : ""
                            }>Medium</option>
                            <option value="3rem" ${
                              heading.style.fontSize === "3rem"
                                ? "selected"
                                : ""
                            }>Large</option>
                        </select>
                    </div>
                    <div class="property-group">
                        <label class="property-label" for="heading-color">Text Color</label>
                        <input type="color" class="color-input" id="heading-color" value="${
                          this.rgbToHex(heading.style.color) || "#333333"
                        }">
                    </div>
                    <div class="property-group">
                        <label class="property-label" for="heading-align">Text Alignment</label>
                        <select class="property-input" id="heading-align">
                            <option value="left" ${
                              heading.style.textAlign === "left" ||
                              !heading.style.textAlign
                                ? "selected"
                                : ""
                            }>Left</option>
                            <option value="center" ${
                              heading.style.textAlign === "center"
                                ? "selected"
                                : ""
                            }>Center</option>
                            <option value="right" ${
                              heading.style.textAlign === "right"
                                ? "selected"
                                : ""
                            }>Right</option>
                        </select>
                    </div>
                    <button class="delete-element-btn">Delete Element</button>
                `;
        break;

      case "image":
        const image = this.selectedElement.querySelector(".dropped-image");
        const container = this.selectedElement; // ✅ Get container for alignment
        const currentAlign = container.style.textAlign || "left"; // ✅ Check container alignment

        propertiesHTML = `
  <div class="property-group">
      <label class="property-label" for="image-src">Image URL</label>
      <input type="url" class="property-input" id="image-src" value="${
        image.src
      }">
  </div>
  <div class="property-group">
      <label class="property-label" for="image-alt">Alt Text</label>
      <input type="text" class="property-input" id="image-alt" value="${
        image.alt
      }">
  </div>
  <div class="property-group">
      <label class="property-label" for="image-align">Image Alignment</label>
      <select class="property-input" id="image-align">
          <option value="left" ${
            currentAlign === "left" ? "selected" : ""
          }>Left</option>
          <option value="center" ${
            currentAlign === "center" ? "selected" : ""
          }>Center</option>
          <option value="right" ${
            currentAlign === "right" ? "selected" : ""
          }>Right</option>
      </select>
  </div>
  <div class="property-group">
      <label class="property-label" for="image-width">Width</label>
      <select class="property-input" id="image-width">
          <option value="100%" ${
            image.style.width === "100%" || !image.style.width ? "selected" : ""
          }>Full Width</option>
          <option value="50%" ${
            image.style.width === "50%" ? "selected" : ""
          }>Half Width</option>
          <option value="25%" ${
            image.style.width === "25%" ? "selected" : ""
          }>Quarter Width</option>
      </select>
  </div>
  <button class="delete-element-btn">Delete Element</button>
`;
        break;

      case "button":
        const button = this.selectedElement.querySelector(".dropped-button");
        const buttonContainer = this.selectedElement; // assume this wraps the button
        const buttonAlign = buttonContainer.style.textAlign || "left";
        const buttonLink = button.dataset.link || "";

        // Determine current button size based on classes or default
        let currentButtonSize = "medium";
        if (button.classList.contains("btn-small")) {
          currentButtonSize = "small";
        } else if (button.classList.contains("btn-large")) {
          currentButtonSize = "large";
        }

        propertiesHTML = `
        <div class="property-group">
            <label class="property-label" for="button-text">Button Text</label>
            <input type="text" class="property-input" id="button-text" value="${
              button.textContent
            }">
        </div>
        <div class="property-group color-row">
  <div class="color-group">
    <label class="property-label" for="button-bg">Background Color</label>
    <input type="color" class="color-input" id="button-bg" value="${
      this.rgbToHex(button.style.backgroundColor) || "#2196f3"
    }">
  </div>
  <div class="color-group">
    <label class="property-label" for="button-text-color">Text Color</label>
    <input type="color" class="color-input" id="button-text-color" value="${
      this.rgbToHex(button.style.color) || "#ffffff"
    }">
  </div>
</div>
        
        <div class="property-group">
            <label class="property-label" for="button-size">Button Size</label>
            <select class="property-input" id="button-size">
                <option value="small" ${
                  currentButtonSize === "small" ? "selected" : ""
                }>Small</option>
                <option value="medium" ${
                  currentButtonSize === "medium" ? "selected" : ""
                }>Medium</option>
                <option value="large" ${
                  currentButtonSize === "large" ? "selected" : ""
                }>Large</option>
            </select>
        </div>
        <div class="property-group">
            <label class="property-label" for="button-align">Button Alignment</label>
            <select class="property-input" id="button-align">
                <option value="left" ${
                  buttonAlign === "left" ? "selected" : ""
                }>Left</option>
                <option value="center" ${
                  buttonAlign === "center" ? "selected" : ""
                }>Center</option>
                <option value="right" ${
                  buttonAlign === "right" ? "selected" : ""
                }>Right</option>
            </select>
        </div>
        <div class="property-group">
    <label class="property-label" for="button-link">Link URL</label>
    <input type="url" class="property-input" id="button-link" value="${buttonLink}" placeholder="https://example.com">
</div>
        <button class="delete-element-btn">Delete Element</button>
    `;
        break;
    }
    propertiesContent.innerHTML = propertiesHTML;

    // Attach event listeners for the newly rendered property inputs
    this.attachPropertyListeners();
  }

  /**
   * Attaches event listeners to the property input fields in the properties panel.
   * These listeners update the selected element's styles or content in real-time.
   */
  attachPropertyListeners() {
    const propertiesContent = document.getElementById("properties-content");

    // Heading properties listeners
    const headingText = propertiesContent.querySelector("#heading-text");
    const headingSize = propertiesContent.querySelector("#heading-size");
    const headingColor = propertiesContent.querySelector("#heading-color");
    const headingAlign = propertiesContent.querySelector("#heading-align");

    if (headingText) {
      headingText.addEventListener("input", (e) => {
        const heading = this.selectedElement.querySelector(".dropped-heading");
        heading.textContent = e.target.value;
      });
    }
    if (headingSize) {
      headingSize.addEventListener("change", (e) => {
        const heading = this.selectedElement.querySelector(".dropped-heading");
        heading.style.fontSize = e.target.value;
      });
    }
    if (headingColor) {
      headingColor.addEventListener("change", (e) => {
        const heading = this.selectedElement.querySelector(".dropped-heading");
        heading.style.color = e.target.value;
      });
    }
    if (headingAlign) {
      headingAlign.addEventListener("change", (e) => {
        const heading = this.selectedElement.querySelector(".dropped-heading");
        heading.style.textAlign = e.target.value;
      });
    }

    // Image properties listeners
    const imageSrc = propertiesContent.querySelector("#image-src");
    const imageAlt = propertiesContent.querySelector("#image-alt");
    const imageWidth = propertiesContent.querySelector("#image-width");
    const imageAlign = propertiesContent.querySelector("#image-align");
    if (imageAlign) {
      imageAlign.addEventListener("change", (e) => {
        const container = this.selectedElement; // ✅ Apply to container
        const image = container.querySelector(".dropped-image");
        const align = e.target.value;

        // Apply alignment to container, not image
        container.style.textAlign = align;

        // Reset image styles
        image.style.display = "block";
        image.style.margin = "";

        if (align === "center") {
          image.style.margin = "0 auto";
        } else if (align === "left") {
          image.style.margin = "0 auto 0 0";
        } else if (align === "right") {
          image.style.margin = "0 0 0 auto";
        }
      });
    }

    if (imageSrc) {
      imageSrc.addEventListener("input", (e) => {
        const image = this.selectedElement.querySelector(".dropped-image");
        image.src = e.target.value;
      });
    }
    if (imageAlt) {
      imageAlt.addEventListener("input", (e) => {
        const image = this.selectedElement.querySelector(".dropped-image");
        image.alt = e.target.value;
      });
    }
    if (imageWidth) {
      imageWidth.addEventListener("change", (e) => {
        const image = this.selectedElement.querySelector(".dropped-image");
        image.style.width = e.target.value;
      });
    }

    // Button properties listeners
    const buttonText = propertiesContent.querySelector("#button-text");
    const buttonBg = propertiesContent.querySelector("#button-bg");
    const buttonLink = propertiesContent.querySelector("#button-link");
    const buttonTextColor =
      propertiesContent.querySelector("#button-text-color");
    const buttonSize = propertiesContent.querySelector("#button-size");
    const buttonAlign = propertiesContent.querySelector("#button-align");
    if (buttonAlign) {
      buttonAlign.addEventListener("change", (e) => {
        const container = this.selectedElement; // ✅ Apply to container
        const button = container.querySelector(".dropped-button");
        const align = e.target.value;

        // Apply alignment to container, not button
        container.style.textAlign = align;

        // Reset button styles
        button.style.display = "inline-block";
        button.style.margin = "";
      });
    }

    if (buttonText) {
      buttonText.addEventListener("input", (e) => {
        const button = this.selectedElement.querySelector(".dropped-button");
        button.textContent = e.target.value;
      });
    }
    if (buttonLink) {
      buttonLink.addEventListener("input", (e) => {
        const button = this.selectedElement.querySelector(".dropped-button");
        button.dataset.link = e.target.value;

        // Add visual indicator if link is set
        if (e.target.value.trim()) {
          button.style.cursor = "pointer";
          button.title = `Links to: ${e.target.value}`;
        } else {
          button.style.cursor = "default";
          button.title = "";
        }
      });
    }
    if (buttonBg) {
      buttonBg.addEventListener("change", (e) => {
        const button = this.selectedElement.querySelector(".dropped-button");
        button.style.backgroundColor = e.target.value;
      });
    }
    if (buttonTextColor) {
      buttonTextColor.addEventListener("change", (e) => {
        const button = this.selectedElement.querySelector(".dropped-button");
        button.style.color = e.target.value;
      });
    }
    if (buttonSize) {
      buttonSize.addEventListener("change", (e) => {
        const button = this.selectedElement.querySelector(".dropped-button");
        // Remove existing size classes as we'll rely on inline styles
        button.classList.remove("btn-small", "btn-large");

        // Apply inline styles based on selected size
        if (e.target.value === "small") {
          button.style.padding = "0.5rem 1rem";
          button.style.fontSize = "0.875rem";
        } else if (e.target.value === "large") {
          button.style.padding = "1rem 2rem";
          button.style.fontSize = "1.125rem";
        } else {
          // Medium (default)
          button.style.padding = "0.75rem 1.5rem";
          button.style.fontSize = "1rem";
        }
        // Also ensure background and text color are explicitly set as inline styles
        // This is a good practice to ensure consistency during export/preview
        button.style.backgroundColor =
          button.style.backgroundColor || "#2196f3"; // Default if not set
        button.style.color = button.style.color || "#ffffff"; // Default if not set
      });
    }

    // Delete element button listener in the properties panel
    const deleteBtn = propertiesContent.querySelector(".delete-element-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", () => {
        // Remove the selected element from the canvas
        if (this.selectedElement) {
          this.selectedElement.remove();
          this.selectedElement = null; // Clear selection
          this.updatePropertiesPanel(); // Update panel to show no selection
        }
        // If no elements are left on canvas, show placeholder
        const canvas = document.getElementById("canvas");
        if (canvas.children.length === 0) {
          canvas.innerHTML = `
                        <div class="canvas-placeholder">
                            <h3>Drag elements here to start building</h3>
                            <p>Select any element on the canvas to edit its properties</p>
                        </div>
                    `;
        }
      });
    }
  }

  /**
   * Converts an RGB color string to its hexadecimal representation.
   * Handles cases where input is empty, already hex, or the default 'rgb(51, 51, 51)'.
   * @param {string} rgb - The RGB color string (e.g., "rgb(255, 0, 0)").
   * @returns {string} The hexadecimal color string (e.g., "#FF0000").
   */
  rgbToHex(rgb) {
    if (!rgb || rgb === "" || rgb === "rgb(51, 51, 51)") return "#333333"; // Default text color
    if (rgb.startsWith("#")) return rgb; // Already a hex color

    // Extract RGB values using regex
    const result = rgb.match(/\d+/g);
    if (!result || result.length < 3) return "#333333"; // Return default if parsing fails

    // Convert each RGB component to a two-digit hexadecimal string
    const hex = result
      .map((x) => {
        const hexVal = parseInt(x).toString(16);
        return hexVal.length === 1 ? "0" + hexVal : hexVal;
      })
      .join("");

    return "#" + hex;
  }

  /**
   * Toggles the preview mode for the builder.
   * In preview mode, the toolbar and properties panel are hidden, and element borders are removed.
   */
  /**
   * Toggles the preview mode for the builder.
   * In preview mode, the toolbar and properties panel are hidden, and element borders are removed.
   */
  togglePreview() {
    const canvas = document.getElementById("canvas");
    const elements = canvas.querySelectorAll(".dropped-element");

    let html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        padding: 20px;
        margin: 0;
        line-height: 1.6;
      }

      @media (max-width: 768px) {
        body {
          padding: 10px;
        }
      }

      h2 {
        margin: 0.5rem 0;
        word-wrap: break-word;
      }

      img {
        max-width: 100%;
        height: auto;
        display: block;
      }

      button {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 1rem;
        font-weight: 500;
        margin: 0.5rem 0;
        transition: background-color 0.2s ease;
        max-width: 100%;
        word-wrap: break-word;
      }

      @media (max-width: 768px) {
        button {
          padding: 0.6rem 1.2rem;
          font-size: 0.9rem;
        }
      }

      button:hover {
        opacity: 0.9;
      }

      /* Mobile responsive utilities */
      @media (max-width: 768px) {
        h2 {
          font-size: 1.5rem !important;
        }
      }
    </style>
  </head>
  <body>
`;

    elements.forEach((element) => {
      const type = element.dataset.type;
      if (type === "heading") {
        const heading = element.querySelector(".dropped-heading");
        const style = heading.style.cssText
          ? `style="${heading.style.cssText}"`
          : "";
        html += `<h2 ${style}>${heading.textContent}</h2>`;
      } else if (type === "image") {
        const img = element.querySelector(".dropped-image");
        const style = img.style.cssText ? `style="${img.style.cssText}"` : "";
        html += `<img src="${img.src}" alt="${img.alt}" ${style}>`;
      } else if (type === "button") {
        const btn = element.querySelector(".dropped-button");
        const buttonAlign = element.style.textAlign || "left";
        const bgColor = btn.style.backgroundColor || "#2196f3";
        const textColor = btn.style.color || "#ffffff";
        const padding = btn.style.padding || "0.75rem 1.5rem";
        const fontSize = btn.style.fontSize || "1rem";
        const linkUrl = btn.dataset.link || "";

        if (linkUrl.trim()) {
          html += `
<div style="text-align: ${buttonAlign}; margin: 1rem 0;">
  <a href="${linkUrl}" target="_blank" style="text-decoration: none;">
    <button style="background-color: ${bgColor}; color: ${textColor}; padding: ${padding}; font-size: ${fontSize};">
      ${btn.textContent}
    </button>
  </a>
</div>
`;
        } else {
          html += `
<div style="text-align: ${buttonAlign}; margin: 1rem 0;">
  <button style="background-color: ${bgColor}; color: ${textColor}; padding: ${padding}; font-size: ${fontSize};">
    ${btn.textContent}
  </button>
</div>
`;
        }
      }
    });

    html += `
    </body>
  </html>
`;

    const previewWindow = window.open();
    previewWindow.document.write(html);
    previewWindow.document.close();
  }
  /**
   * Exports the current state of the canvas as a standalone HTML file.
   * It generates HTML with inline styles for the dropped elements.
   */
  exportHTML() {
    const canvas = document.getElementById("canvas");
    const elements = canvas.querySelectorAll(".dropped-element");

    let html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n';
    html += '  <meta charset="UTF-8">\n';
    html +=
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
    html += "  <title>My Website</title>\n";
    html += "  <style>\n";
    // Enhanced mobile-responsive global styles
    html +=
      '    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }\n';
    html += "    @media (max-width: 768px) { body { padding: 10px; } }\n";
    html +=
      "    .container { max-width: 1200px; margin: 0 auto; padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }\n";
    html += "    @media (max-width: 768px) { .container { padding: 15px; } }\n";
    html += "    h1, h2, h3 { margin: 0.5rem 0; word-wrap: break-word; }\n";
    html +=
      "    @media (max-width: 768px) { h1, h2, h3 { font-size: 1.5rem; } }\n";
    html +=
      "    img { max-width: 100%; height: auto; border-radius: 4px; margin: 0.5rem 0; display: block; }\n";
    html +=
      "    button { padding: 0.75rem 1.5rem; border: none; border-radius: 6px; cursor: pointer; font-size: 1rem; font-weight: 500; margin: 0.5rem 0; transition: background-color 0.2s ease; max-width: 100%; word-wrap: break-word; }\n";
    html +=
      "    @media (max-width: 768px) { button { padding: 0.6rem 1.2rem; font-size: 0.9rem; } }\n";
    html += "    button:hover { opacity: 0.9; }\n";
    html += "  </style>\n";
    html += "</head>\n<body>\n";
    html += '  <div class="container">\n';

    // Rest of the export functionality remains the same...
    elements.forEach((element) => {
      const type = element.dataset.type;

      if (type === "heading") {
        const heading = element.querySelector(".dropped-heading");
        const fontSize = heading.style.fontSize || "2rem";
        const color = heading.style.color || "#333";
        const textAlign = heading.style.textAlign || "left";
        const style = `style="font-size: ${fontSize}; color: ${color}; text-align: ${textAlign};"`;
        html += `    <h2 ${style}>${heading.textContent}</h2>\n`;
      } else if (type === "image") {
        const img = element.querySelector(".dropped-image");
        const widthStyle = img.style.width ? `width: ${img.style.width};` : "";
        html += `    <img src="${img.src}" alt="${img.alt}" style="${widthStyle}">\n`;
      } else if (type === "button") {
        const btn = element.querySelector(".dropped-button");
        const container = element;
        const buttonAlign = container.style.textAlign || "left";
        const bgColor = btn.style.backgroundColor || "#2196f3";
        const textColor = btn.style.color || "white";
        const padding = btn.style.padding || "0.75rem 1.5rem";
        const fontSize = btn.style.fontSize || "1rem";
        const linkUrl = btn.dataset.link || "";
        const style = `style="background-color: ${bgColor}; color: ${textColor}; padding: ${padding}; font-size: ${fontSize};"`;

        if (linkUrl.trim()) {
          html += `    <div style="text-align: ${buttonAlign}; margin: 1rem 0;">\n`;
          html += `      <a href="${linkUrl}" target="_blank" style="text-decoration: none;">\n`;
          html += `        <button ${style}>${btn.textContent}</button>\n`;
          html += `      </a>\n`;
          html += `    </div>\n`;
        } else {
          html += `    <div style="text-align: ${buttonAlign}; margin: 1rem 0;">\n`;
          html += `      <button ${style}>${btn.textContent}</button>\n`;
          html += `    </div>\n`;
        }
      }
    });

    html += "  </div>\n";
    html += "</body>\n</html>";

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-website.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Initialize the application once the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  new WebsiteBuilder();
});
