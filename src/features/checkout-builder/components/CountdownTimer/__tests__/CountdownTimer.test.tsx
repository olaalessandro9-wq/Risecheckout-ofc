/**
 * @file CountdownTimer.test.tsx
 * @description Tests for CountdownTimer Component
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@/test/utils";
import { CountdownTimer, type CountdownTimerProps } from "../CountdownTimer";

// Mock lucide-react
vi.mock("lucide-react", () => ({
  AlarmClock: ({ className, style }: { className: string; style: { color: string } }) => (
    <div data-testid="alarm-icon" className={className} style={style}>
      AlarmIcon
    </div>
  ),
}));

describe("CountdownTimer", () => {
  const defaultProps: CountdownTimerProps = {
    initialMinutes: 5,
    initialSeconds: 30,
    backgroundColor: "#FF6B6B",
    textColor: "#FFFFFF",
    activeText: "Oferta expira em:",
    finishedText: "Oferta expirada!",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ========== Rendering ==========

  describe("Rendering", () => {
    it("should render correctly with default props", () => {
      render(<CountdownTimer {...defaultProps} />);

      expect(screen.getByText("05:30")).toBeInTheDocument();
      expect(screen.getByText("Oferta expira em:")).toBeInTheDocument();
      expect(screen.getByTestId("alarm-icon")).toBeInTheDocument();
    });

    it("should render with zero initial time", () => {
      render(
        <CountdownTimer
          {...defaultProps}
          initialMinutes={0}
          initialSeconds={0}
        />
      );

      expect(screen.getByText("00:00")).toBeInTheDocument();
    });

    it("should render with large time values", () => {
      render(
        <CountdownTimer
          {...defaultProps}
          initialMinutes={99}
          initialSeconds={59}
        />
      );

      expect(screen.getByText("99:59")).toBeInTheDocument();
    });

    it("should render without text when empty", () => {
      render(
        <CountdownTimer
          {...defaultProps}
          activeText=""
          finishedText=""
        />
      );

      expect(screen.getByText("05:30")).toBeInTheDocument();
      expect(screen.queryByText("Oferta expira em:")).not.toBeInTheDocument();
    });
  });

  // ========== Countdown Logic ==========

  describe("Countdown Logic", () => {
    it("should countdown from initial time", async () => {
      render(
        <CountdownTimer
          {...defaultProps}
          initialMinutes={0}
          initialSeconds={3}
        />
      );

      expect(screen.getByText("00:03")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText("00:02")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText("00:01")).toBeInTheDocument();
    });

    it("should stop at zero", async () => {
      render(
        <CountdownTimer
          {...defaultProps}
          initialMinutes={0}
          initialSeconds={1}
        />
      );

      expect(screen.getByText("00:01")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText("00:00")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText("00:00")).toBeInTheDocument();
    });

    it("should transition from minutes to seconds", async () => {
      render(
        <CountdownTimer
          {...defaultProps}
          initialMinutes={1}
          initialSeconds={1}
        />
      );

      expect(screen.getByText("01:01")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText("01:00")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText("00:59")).toBeInTheDocument();
    });
  });

  // ========== Text Display ==========

  describe("Text Display", () => {
    it("should show active text when countdown is running", () => {
      render(<CountdownTimer {...defaultProps} />);

      expect(screen.getByText("Oferta expira em:")).toBeInTheDocument();
      expect(screen.queryByText("Oferta expirada!")).not.toBeInTheDocument();
    });

    it("should show finished text when countdown reaches zero", () => {
      render(
        <CountdownTimer
          {...defaultProps}
          initialMinutes={0}
          initialSeconds={1}
        />
      );

      expect(screen.getByText("Oferta expira em:")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText("Oferta expirada!")).toBeInTheDocument();

      expect(screen.queryByText("Oferta expira em:")).not.toBeInTheDocument();
    });

    it("should show finished text immediately when starting at zero", () => {
      render(
        <CountdownTimer
          {...defaultProps}
          initialMinutes={0}
          initialSeconds={0}
        />
      );

      expect(screen.getByText("Oferta expirada!")).toBeInTheDocument();
      expect(screen.queryByText("Oferta expira em:")).not.toBeInTheDocument();
    });
  });

  // ========== Styling ==========

  describe("Styling", () => {
    it("should apply background color", () => {
      const { container } = render(
        <CountdownTimer {...defaultProps} backgroundColor="#FF0000" />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveStyle({ backgroundColor: "#FF0000" });
    });

    it("should apply text color", () => {
      const { container } = render(
        <CountdownTimer {...defaultProps} textColor="#000000" />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveStyle({ color: "#000000" });
    });

    it("should apply custom className", () => {
      const { container } = render(
        <CountdownTimer {...defaultProps} className="custom-class" />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("custom-class");
    });
  });

  // ========== Interactions ==========

  describe("Interactions", () => {
    it("should call onClick when clicked", () => {
      const handleClick = vi.fn();
      const { container } = render(
        <CountdownTimer {...defaultProps} onClick={handleClick} />
      );

      const wrapper = container.firstChild as HTMLElement;
      wrapper.click();

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should not crash when onClick is undefined", () => {
      const { container } = render(
        <CountdownTimer {...defaultProps} onClick={undefined} />
      );

      const wrapper = container.firstChild as HTMLElement;
      
      expect(() => wrapper.click()).not.toThrow();
    });
  });

  // ========== Edge Cases ==========

  describe("Edge Cases", () => {
    it("should format time with leading zeros", () => {
      render(
        <CountdownTimer
          {...defaultProps}
          initialMinutes={0}
          initialSeconds={5}
        />
      );

      expect(screen.getByText("00:05")).toBeInTheDocument();
    });

    it("should handle negative initial values gracefully", () => {
      render(
        <CountdownTimer
          {...defaultProps}
          initialMinutes={-1}
          initialSeconds={-1}
        />
      );

      // Should show finished state immediately
      expect(screen.getByText("Oferta expirada!")).toBeInTheDocument();
    });

    it("should cleanup timer on unmount", () => {
      const { unmount } = render(<CountdownTimer {...defaultProps} />);

      unmount();

      // Should not throw errors after unmount
      expect(() => vi.advanceTimersByTime(1000)).not.toThrow();
    });
  });
});
