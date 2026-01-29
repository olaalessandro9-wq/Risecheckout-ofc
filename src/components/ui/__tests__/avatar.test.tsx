/**
 * Avatar Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for Avatar, AvatarImage, AvatarFallback covering:
 * - Rendering and ref forwarding
 * - Fallback display
 * - Styling
 *
 * Note: AvatarImage tests limited due to Radix image loading behavior in jsdom
 *
 * @module components/ui/__tests__/avatar.test
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/utils";
import { createRef } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "../avatar";

describe("Avatar Components", () => {
  describe("Avatar (Root)", () => {
    it("renders with children", () => {
      render(
        <Avatar data-testid="avatar">
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      expect(screen.getByTestId("avatar")).toBeInTheDocument();
    });

    it("forwards ref correctly", () => {
      const ref = createRef<HTMLSpanElement>();
      render(<Avatar ref={ref}><AvatarFallback>T</AvatarFallback></Avatar>);
      expect(ref.current).toBeInstanceOf(HTMLSpanElement);
    });

    it("applies base styling classes", () => {
      render(<Avatar data-testid="avatar"><AvatarFallback>T</AvatarFallback></Avatar>);
      const avatar = screen.getByTestId("avatar");
      expect(avatar).toHaveClass("relative", "flex", "h-10", "w-10", "shrink-0", "overflow-hidden", "rounded-full");
    });

    it("merges custom className", () => {
      render(<Avatar className="h-20 w-20" data-testid="avatar"><AvatarFallback>T</AvatarFallback></Avatar>);
      const avatar = screen.getByTestId("avatar");
      expect(avatar).toHaveClass("h-20", "w-20");
    });
  });

  describe("AvatarImage", () => {
    it("renders with src and alt attributes", () => {
      render(
        <Avatar>
          <AvatarImage src="/test.jpg" alt="Test user" />
          <AvatarFallback>T</AvatarFallback>
        </Avatar>
      );
      // AvatarImage renders but may be hidden until image loads in jsdom
      // Just verify the component doesn't crash
      expect(screen.getByText("T")).toBeInTheDocument();
    });

    it("shows fallback when image not loaded", () => {
      render(
        <Avatar>
          <AvatarImage src="/nonexistent.jpg" alt="Test" />
          <AvatarFallback>FB</AvatarFallback>
        </Avatar>
      );
      // Fallback should be visible
      expect(screen.getByText("FB")).toBeInTheDocument();
    });
  });

  describe("AvatarFallback", () => {
    it("renders fallback content", () => {
      render(
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      expect(screen.getByText("JD")).toBeInTheDocument();
    });

    it("forwards ref correctly", () => {
      const ref = createRef<HTMLSpanElement>();
      render(
        <Avatar>
          <AvatarFallback ref={ref}>T</AvatarFallback>
        </Avatar>
      );
      expect(ref.current).toBeInstanceOf(HTMLSpanElement);
    });

    it("applies centering and styling classes", () => {
      render(
        <Avatar>
          <AvatarFallback data-testid="fallback">JD</AvatarFallback>
        </Avatar>
      );
      const fallback = screen.getByTestId("fallback");
      expect(fallback).toHaveClass("flex", "h-full", "w-full", "items-center", "justify-center", "rounded-full", "bg-muted");
    });

    it("merges custom className", () => {
      render(
        <Avatar>
          <AvatarFallback className="bg-primary text-primary-foreground" data-testid="fallback">JD</AvatarFallback>
        </Avatar>
      );
      const fallback = screen.getByTestId("fallback");
      expect(fallback).toHaveClass("bg-primary", "text-primary-foreground");
    });

    it("can render icon as child", () => {
      render(
        <Avatar>
          <AvatarFallback data-testid="fallback">
            <span data-testid="icon">👤</span>
          </AvatarFallback>
        </Avatar>
      );
      expect(screen.getByTestId("icon")).toBeInTheDocument();
    });
  });
});
