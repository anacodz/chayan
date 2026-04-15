import { beforeEach, describe, expect, it, vi } from "vitest";
import { exportToPDF } from "./pdf";

const addImage = vi.fn();
const save = vi.fn();

vi.mock("html2canvas", () => ({
  default: vi.fn(async () => ({
    toDataURL: () => "data:image/png;base64,abc",
  })),
}));

vi.mock("jspdf", () => {
  return {
    default: vi.fn(function JsPDFMock() {
      return {
        internal: {
          pageSize: {
            getWidth: () => 210,
            getHeight: () => 297,
          },
        },
        getImageProperties: () => ({ width: 1000, height: 1200 }),
        addImage,
        addPage: vi.fn(),
        save,
      };
    }),
  };
});

describe("exportToPDF", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    addImage.mockReset();
    save.mockReset();
  });

  it("returns false when target element is missing", async () => {
    const result = await exportToPDF("missing", "report.pdf");
    expect(result).toBe(false);
  });

  it("exports PDF and restores no-print visibility", async () => {
    document.body.innerHTML = `
      <div id="report-content">
        <button class="no-print">Hidden in PDF</button>
        <p>Body</p>
      </div>
    `;

    const noPrint = document.querySelector(".no-print") as HTMLElement;
    const result = await exportToPDF("report-content", "candidate.pdf");

    expect(result).toBe(true);
    expect(addImage).toHaveBeenCalled();
    expect(save).toHaveBeenCalledWith("candidate.pdf");
    expect(noPrint.style.display).toBe("");
  });
});
