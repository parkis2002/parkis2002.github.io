/* =========================================================
   AI Learning Visualization
   Pure JavaScript + SVG
   No external dependency
   ========================================================= */

(function () {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";

  function svgElement(tag, attrs = {}) {
    const el = document.createElementNS(NS, tag);

    Object.entries(attrs).forEach(([key, value]) => {
      el.setAttribute(key, value);
    });

    return el;
  }

  function clear(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  function makeSVG(width = 700, height = 360) {
    const svg = svgElement("svg", {
      viewBox: `0 0 ${width} ${height}`,
      preserveAspectRatio: "xMidYMid meet"
    });

    return svg;
  }

  function line(svg, x1, y1, x2, y2, className = "") {
    const l = svgElement("line", {
      x1,
      y1,
      x2,
      y2,
      class: className
    });

    svg.appendChild(l);
    return l;
  }

  function text(svg, x, y, value, className = "") {
    const t = svgElement("text", {
      x,
      y,
      class: className
    });

    t.textContent = value;
    svg.appendChild(t);

    return t;
  }

  function arrow(svg, x1, y1, x2, y2, className = "vector") {
    const markerId = `arrow-${Math.random().toString(36).slice(2)}`;

    const defs = svgElement("defs");

    const marker = svgElement("marker", {
      id: markerId,
      markerWidth: 10,
      markerHeight: 10,
      refX: 8,
      refY: 3,
      orient: "auto",
      markerUnits: "strokeWidth"
    });

    const path = svgElement("path", {
      d: "M0,0 L0,6 L9,3 z",
      fill: "currentColor"
    });

    marker.appendChild(path);
    defs.appendChild(marker);
    svg.appendChild(defs);

    const l = svgElement("line", {
      x1,
      y1,
      x2,
      y2,
      class: className,
      "marker-end": `url(#${markerId})`
    });

    svg.appendChild(l);

    return l;
  }

  /* =======================================================
     1. VECTOR VIEWER
     ======================================================= */

  function createVectorViewer(root) {
    root.innerHTML = `
      <div class="ai-viz-title">
        Vector: 정보를 숫자들의 묶음으로 표현하기
      </div>

      <div class="ai-viz-description">
        슬라이더를 움직여 벡터의 각 원소가 좌표에 어떻게 대응하는지 확인해보세요.
      </div>

      <div class="ai-viz-container"></div>

      <div class="ai-viz-controls">

        <label class="ai-viz-control">
          x₁
          <input id="x1" type="range" min="-5" max="5"
                 step="0.1" value="3">
          <span class="ai-viz-value" id="x1-value">3.0</span>
        </label>

        <label class="ai-viz-control">
          x₂
          <input id="x2" type="range" min="-5" max="5"
                 step="0.1" value="2">
          <span class="ai-viz-value" id="x2-value">2.0</span>
        </label>

      </div>

      <div class="ai-viz-equation" id="vector-equation"></div>
    `;

    const container = root.querySelector(".ai-viz-container");
    const x1Slider = root.querySelector("#x1");
    const x2Slider = root.querySelector("#x2");

    const x1Value = root.querySelector("#x1-value");
    const x2Value = root.querySelector("#x2-value");
    const equation = root.querySelector("#vector-equation");

    const svg = makeSVG();
    container.appendChild(svg);

    function render() {
      clear(svg);

      const x1 = Number(x1Slider.value);
      const x2 = Number(x2Slider.value);

      x1Value.textContent = x1.toFixed(1);
      x2Value.textContent = x2.toFixed(1);

      const cx = 350;
      const cy = 180;
      const scale = 40;

      // Grid
      for (let i = -7; i <= 7; i++) {
        line(
          svg,
          cx + i * scale,
          20,
          cx + i * scale,
          340,
          "grid"
        );

        line(
          svg,
          70,
          cy - i * scale,
          630,
          cy - i * scale,
          "grid"
        );
      }

      // Axes
      line(svg, 70, cy, 630, cy, "axis");
      line(svg, cx, 340, cx, 20, "axis");

      // Vector
      const px = cx + x1 * scale;
      const py = cy - x2 * scale;

      arrow(svg, cx, cy, px, py, "vector");

      svg.appendChild(
        svgElement("circle", {
          cx: px,
          cy: py,
          r: 6,
          class: "point"
        })
      );

      text(svg, px + 10, py - 10, "x", "label");

      text(svg, 635, cy - 5, "x₁", "label");
      text(svg, cx + 8, 25, "x₂", "label");

      equation.innerHTML =
        `x = [ ${x1.toFixed(1)}, ${x2.toFixed(1)} ]<sup>T</sup>`;
    }

    x1Slider.addEventListener("input", render);
    x2Slider.addEventListener("input", render);

    render();
  }


  /* =======================================================
     2. EMBEDDING SPACE
     ======================================================= */

  function createEmbeddingSpace(root) {
    root.innerHTML = `
      <div class="ai-viz-title">
        Token Embedding Space
      </div>

      <div class="ai-viz-description">
        단어를 벡터로 표현하면 벡터 공간에서 단어 사이의 관계를 시각화할 수 있습니다.
        점을 직접 드래그해보세요.
      </div>

      <div class="ai-viz-container"></div>

      <div class="ai-viz-info">
        실제 LLM의 embedding 차원은 보통 2차원보다 훨씬 크며,
        각 차원이 하나의 명확한 의미를 갖는다고 볼 수는 없습니다.
      </div>
    `;

    const container = root.querySelector(".ai-viz-container");
    const svg = makeSVG();

    container.appendChild(svg);

    const points = [
      { name: "king", x: 4, y: 3 },
      { name: "queen", x: 4, y: 1 },
      { name: "man", x: 1, y: 3 },
      { name: "woman", x: 1, y: 1 }
    ];

    const cx = 350;
    const cy = 180;
    const scale = 50;

    function render() {
      clear(svg);

      // Grid
      for (let i = -5; i <= 5; i++) {
        line(
          svg,
          cx + i * scale,
          30,
          cx + i * scale,
          330,
          "grid"
        );

        line(
          svg,
          100,
          cy - i * scale,
          600,
          cy - i * scale,
          "grid"
        );
      }

      line(svg, 100, cy, 600, cy, "axis");
      line(svg, cx, 330, cx, 30, "axis");

      points.forEach((p) => {
        const px = cx + p.x * scale;
        const py = cy - p.y * scale;

        const circle = svgElement("circle", {
          cx: px,
          cy: py,
          r: 8,
          class: "embedding-point point"
        });

        circle.dataset.name = p.name;

        svg.appendChild(circle);

        text(
          svg,
          px + 12,
          py - 10,
          p.name,
          "label"
        );

        enableDragging(circle, p, render);
      });
    }

    function enableDragging(circle, point, redraw) {
      let dragging = false;

      circle.addEventListener("pointerdown", (event) => {
        dragging = true;
        circle.setPointerCapture(event.pointerId);
      });

      circle.addEventListener("pointermove", (event) => {
        if (!dragging) return;

        const rect = svg.getBoundingClientRect();

        const svgX =
          (event.clientX - rect.left) *
          (700 / rect.width);

        const svgY =
          (event.clientY - rect.top) *
          (360 / rect.height);

        point.x = (svgX - cx) / scale;
        point.y = (cy - svgY) / scale;

        redraw();
      });

      circle.addEventListener("pointerup", () => {
        dragging = false;
      });
    }

    render();
  }


  /* =======================================================
     3. DOT PRODUCT PLAYGROUND
     ======================================================= */

  function createDotProduct(root) {
    root.innerHTML = `
      <div class="ai-viz-title">
        Dot Product: 두 벡터의 방향은 얼마나 비슷한가?
      </div>

      <div class="ai-viz-description">
        각도를 움직여보세요. 두 벡터 사이의 각도가 변하면
        dot product도 함께 변합니다.
      </div>

      <div class="ai-viz-container"></div>

      <div class="ai-viz-controls">

        <label class="ai-viz-control">
          θ
          <input id="angle" type="range"
                 min="0" max="180"
                 step="1" value="45">
          <span class="ai-viz-value" id="angle-value">
            45°
          </span>
        </label>

      </div>

      <div class="ai-viz-equation" id="dot-equation"></div>
    `;

    const container = root.querySelector(".ai-viz-container");
    const slider = root.querySelector("#angle");
    const angleValue = root.querySelector("#angle-value");
    const equation = root.querySelector("#dot-equation");

    const svg = makeSVG();
    container.appendChild(svg);

    function render() {
      clear(svg);

      const angle = Number(slider.value);
      const theta = angle * Math.PI / 180;

      const magnitudeQ = 3;
      const magnitudeK = 3;

      const cx = 350;
      const cy = 190;
      const scale = 45;

      // Grid
      for (let i = -6; i <= 6; i++) {
        line(
          svg,
          cx + i * scale,
          30,
          cx + i * scale,
          340,
          "grid"
        );

        line(
          svg,
          80,
          cy - i * scale,
          620,
          cy - i * scale,
          "grid"
        );
      }

      line(svg, 80, cy, 620, cy, "axis");
      line(svg, cx, 340, cx, 30, "axis");

      // q
      const qx = cx + magnitudeQ * scale;
      const qy = cy;

      // k
      const kx =
        cx + magnitudeK * Math.cos(theta) * scale;

      const ky =
        cy - magnitudeK * Math.sin(theta) * scale;

      arrow(svg, cx, cy, qx, qy, "vector");
      arrow(svg, cx, cy, kx, ky, "vector-secondary");

      text(svg, qx + 8, qy - 10, "q", "label");
      text(svg, kx + 8, ky - 10, "k", "label");

      const dot =
        magnitudeQ *
        magnitudeK *
        Math.cos(theta);

      angleValue.textContent = `${angle}°`;

      equation.innerHTML =
        `q<sup>T</sup>k =
         ||q||||k||cosθ =
         <strong>${dot.toFixed(2)}</strong>`;
    }

    slider.addEventListener("input", render);

    render();
  }


  /* =======================================================
     4. MATRIX TRANSFORMATION
     ======================================================= */

  function createMatrixTransform(root) {
    root.innerHTML = `
      <div class="ai-viz-title">
        Matrix Multiplication: 공간을 변환하기
      </div>

      <div class="ai-viz-description">
        행렬 W가 2차원 공간의 점들을 어떻게 변환하는지 확인해보세요.
      </div>

      <div class="ai-viz-container"></div>

      <div class="ai-viz-controls">

        <label class="ai-viz-control">
          Scale X
          <input id="sx" type="range"
                 min="0.2" max="3"
                 step="0.1" value="1.5">
          <span class="ai-viz-value" id="sx-value">1.5</span>
        </label>

        <label class="ai-viz-control">
          Scale Y
          <input id="sy" type="range"
                 min="0.2" max="3"
                 step="0.1" value="1">
          <span class="ai-viz-value" id="sy-value">1.0</span>
        </label>

        <label class="ai-viz-control">
          Rotation
          <input id="rotation" type="range"
                 min="-180" max="180"
                 step="1" value="0">
          <span class="ai-viz-value" id="rotation-value">
            0°
          </span>
        </label>

      </div>

      <div class="ai-viz-equation" id="matrix-equation"></div>
    `;

    const container = root.querySelector(".ai-viz-container");

    const sxSlider = root.querySelector("#sx");
    const sySlider = root.querySelector("#sy");
    const rotationSlider = root.querySelector("#rotation");

    const sxValue = root.querySelector("#sx-value");
    const syValue = root.querySelector("#sy-value");
    const rotationValue = root.querySelector("#rotation-value");

    const equation = root.querySelector("#matrix-equation");

    const svg = makeSVG();
    container.appendChild(svg);

    const cx = 350;
    const cy = 180;
    const scale = 45;

    function transform(x, y, sx, sy, theta) {
      const r = theta * Math.PI / 180;

      const x1 = sx * x;
      const y1 = sy * y;

      return {
        x: x1 * Math.cos(r) - y1 * Math.sin(r),
        y: x1 * Math.sin(r) + y1 * Math.cos(r)
      };
    }

    function render() {
      clear(svg);

      const sx = Number(sxSlider.value);
      const sy = Number(sySlider.value);
      const angle = Number(rotationSlider.value);

      sxValue.textContent = sx.toFixed(1);
      syValue.textContent = sy.toFixed(1);
      rotationValue.textContent = `${angle}°`;

      // Original grid
      for (let i = -5; i <= 5; i++) {
        line(
          svg,
          cx + i * scale,
          30,
          cx + i * scale,
          330,
          "grid"
        );

        line(
          svg,
          100,
          cy - i * scale,
          600,
          cy - i * scale,
          "grid"
        );
      }

      // Original basis vectors
      arrow(
        svg,
        cx,
        cy,
        cx + scale,
        cy,
        "vector"
      );

      arrow(
        svg,
        cx,
        cy,
        cx,
        cy - scale,
        "vector"
      );

      // Transformed basis
      const ex = transform(1, 0, sx, sy, angle);
      const ey = transform(0, 1, sx, sy, angle);

      arrow(
        svg,
        cx,
        cy,
        cx + ex.x * scale,
        cy - ex.y * scale,
        "vector-secondary"
      );

      arrow(
        svg,
        cx,
        cy,
        cx + ey.x * scale,
        cy - ey.y * scale,
        "vector-result"
      );

      text(
        svg,
        cx + ex.x * scale + 8,
        cy - ex.y * scale,
        "W e₁",
        "label"
      );

      text(
        svg,
        cx + ey.x * scale + 8,
        cy - ey.y * scale,
        "W e₂",
        "label"
      );

      equation.innerHTML =
        `W = Scale × Rotation`;
    }

    sxSlider.addEventListener("input", render);
    sySlider.addEventListener("input", render);
    rotationSlider.addEventListener("input", render);

    render();
  }


  /* =======================================================
     5. BIAS VISUALIZATION
     ======================================================= */

  function createBias(root) {
    root.innerHTML = `
      <div class="ai-viz-title">
        Bias: 변환된 공간에서 위치를 이동시키기
      </div>

      <div class="ai-viz-description">
        bias를 움직이면 같은 weight를 사용하더라도
        결과가 어떻게 이동하는지 확인할 수 있습니다.
      </div>

      <div class="ai-viz-container"></div>

      <div class="ai-viz-controls">

        <label class="ai-viz-control">
          b₁
          <input id="b1" type="range"
                 min="-4" max="4"
                 step="0.1" value="2">
          <span class="ai-viz-value" id="b1-value">2.0</span>
        </label>

        <label class="ai-viz-control">
          b₂
          <input id="b2" type="range"
                 min="-4" max="4"
                 step="0.1" value="1">
          <span class="ai-viz-value" id="b2-value">1.0</span>
        </label>

      </div>

      <div class="ai-viz-equation">
        y = Wx + b
      </div>
    `;

    const container = root.querySelector(".ai-viz-container");

    const b1Slider = root.querySelector("#b1");
    const b2Slider = root.querySelector("#b2");

    const b1Value = root.querySelector("#b1-value");
    const b2Value = root.querySelector("#b2-value");

    const svg = makeSVG();
    container.appendChild(svg);

    function render() {
      clear(svg);

      const b1 = Number(b1Slider.value);
      const b2 = Number(b2Slider.value);

      b1Value.textContent = b1.toFixed(1);
      b2Value.textContent = b2.toFixed(1);

      const cx = 350;
      const cy = 180;
      const scale = 40;

      // Grid
      for (let i = -6; i <= 6; i++) {
        line(
          svg,
          cx + i * scale,
          20,
          cx + i * scale,
          340,
          "grid"
        );

        line(
          svg,
          70,
          cy - i * scale,
          630,
          cy - i * scale,
          "grid"
        );
      }

      // Axes
      line(svg, 70, cy, 630, cy, "axis");
      line(svg, cx, 340, cx, 20, "axis");

      // Original point
      const x = 2;
      const y = 1;

      const px = cx + x * scale;
      const py = cy - y * scale;

      svg.appendChild(
        svgElement("circle", {
          cx: px,
          cy: py,
          r: 6,
          class: "point"
        })
      );

      // Transformed point
      const tx = x + b1;
      const ty = y + b2;

      const tpx = cx + tx * scale;
      const tpy = cy - ty * scale;

      svg.appendChild(
        svgElement("circle", {
          cx: tpx,
          cy: tpy,
          r: 7,
          class: "point-secondary"
        })
      );

      // Bias vector
      arrow(
        svg,
        px,
        py,
        tpx,
        tpy,
        "vector-result"
      );

      text(
        svg,
        px + 8,
        py - 10,
        "Wx",
        "label"
      );

      text(
        svg,
        tpx + 8,
        tpy - 10,
        "Wx + b",
        "label"
      );

      text(
        svg,
        cx + 8,
        30,
        `b = [${b1.toFixed(1)}, ${b2.toFixed(1)}]`,
        "label"
      );
    }

    b1Slider.addEventListener("input", render);
    b2Slider.addEventListener("input", render);

    render();
  }


  /* =======================================================
     INITIALIZATION
     ======================================================= */

  function init() {
    document
      .querySelectorAll("[data-ai-viz]")
      .forEach((element) => {

        const type = element.dataset.aiViz;

        switch (type) {

          case "vector":
            createVectorViewer(element);
            break;

          case "embedding":
            createEmbeddingSpace(element);
            break;

          case "dot-product":
            createDotProduct(element);
            break;

          case "matrix":
            createMatrixTransform(element);
            break;

          case "bias":
            createBias(element);
            break;

          default:
            console.warn(
              `Unknown AI visualization: ${type}`
            );
        }
      });
  }

  /*
   * Jekyll / Chirpy may load scripts after DOMContentLoaded.
   */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();