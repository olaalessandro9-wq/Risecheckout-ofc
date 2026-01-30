/**
 * MembersAreaNavTabs Tests
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - UI Component Tests
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MembersAreaNavTabs } from "../MembersAreaNavTabs";
import type { MembersAreaTabType } from "../../layouts/MembersAreaLayout";

describe("MembersAreaNavTabs", () => {
  const defaultProps = {
    currentTab: "content" as MembersAreaTabType,
    onTabChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render all 5 tabs", () => {
      render(<MembersAreaNavTabs {...defaultProps} />);
      
      expect(screen.getByText("Conteúdo")).toBeInTheDocument();
      expect(screen.getByText("Alunos")).toBeInTheDocument();
      expect(screen.getByText("Grupos")).toBeInTheDocument();
      expect(screen.getByText("Configurações")).toBeInTheDocument();
      expect(screen.getByText("Builder")).toBeInTheDocument();
    });

    it("should render icons for each tab", () => {
      render(<MembersAreaNavTabs {...defaultProps} />);
      
      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        const svg = button.querySelector("svg");
        expect(svg).toBeInTheDocument();
      });
    });
  });

  describe("Active State", () => {
    it("should highlight content tab when active", () => {
      render(<MembersAreaNavTabs currentTab="content" onTabChange={vi.fn()} />);
      
      const contentTab = screen.getByText("Conteúdo").closest("button");
      expect(contentTab).toHaveClass("border-primary");
    });

    it("should highlight students tab when active", () => {
      render(<MembersAreaNavTabs currentTab="students" onTabChange={vi.fn()} />);
      
      const studentsTab = screen.getByText("Alunos").closest("button");
      expect(studentsTab).toHaveClass("border-primary");
    });

    it("should highlight groups tab when active", () => {
      render(<MembersAreaNavTabs currentTab="groups" onTabChange={vi.fn()} />);
      
      const groupsTab = screen.getByText("Grupos").closest("button");
      expect(groupsTab).toHaveClass("border-primary");
    });

    it("should highlight settings tab when active", () => {
      render(<MembersAreaNavTabs currentTab="settings" onTabChange={vi.fn()} />);
      
      const settingsTab = screen.getByText("Configurações").closest("button");
      expect(settingsTab).toHaveClass("border-primary");
    });

    it("should highlight builder tab when active", () => {
      render(<MembersAreaNavTabs currentTab="builder" onTabChange={vi.fn()} />);
      
      const builderTab = screen.getByText("Builder").closest("button");
      expect(builderTab).toHaveClass("border-primary");
    });

    it("should have inactive styling for non-active tabs", () => {
      render(<MembersAreaNavTabs currentTab="content" onTabChange={vi.fn()} />);
      
      const studentsTab = screen.getByText("Alunos").closest("button");
      expect(studentsTab).toHaveClass("border-transparent");
    });
  });

  describe("Interactions", () => {
    it("should call onTabChange when clicking content tab", () => {
      const onTabChange = vi.fn();
      render(<MembersAreaNavTabs currentTab="students" onTabChange={onTabChange} />);
      
      fireEvent.click(screen.getByText("Conteúdo"));
      
      expect(onTabChange).toHaveBeenCalledWith("content");
    });

    it("should call onTabChange when clicking students tab", () => {
      const onTabChange = vi.fn();
      render(<MembersAreaNavTabs currentTab="content" onTabChange={onTabChange} />);
      
      fireEvent.click(screen.getByText("Alunos"));
      
      expect(onTabChange).toHaveBeenCalledWith("students");
    });

    it("should call onTabChange when clicking groups tab", () => {
      const onTabChange = vi.fn();
      render(<MembersAreaNavTabs currentTab="content" onTabChange={onTabChange} />);
      
      fireEvent.click(screen.getByText("Grupos"));
      
      expect(onTabChange).toHaveBeenCalledWith("groups");
    });

    it("should call onTabChange when clicking settings tab", () => {
      const onTabChange = vi.fn();
      render(<MembersAreaNavTabs currentTab="content" onTabChange={onTabChange} />);
      
      fireEvent.click(screen.getByText("Configurações"));
      
      expect(onTabChange).toHaveBeenCalledWith("settings");
    });

    it("should call onTabChange when clicking builder tab", () => {
      const onTabChange = vi.fn();
      render(<MembersAreaNavTabs currentTab="content" onTabChange={onTabChange} />);
      
      fireEvent.click(screen.getByText("Builder"));
      
      expect(onTabChange).toHaveBeenCalledWith("builder");
    });

    it("should call onTabChange even when clicking already active tab", () => {
      const onTabChange = vi.fn();
      render(<MembersAreaNavTabs currentTab="content" onTabChange={onTabChange} />);
      
      fireEvent.click(screen.getByText("Conteúdo"));
      
      expect(onTabChange).toHaveBeenCalledWith("content");
    });
  });
});
