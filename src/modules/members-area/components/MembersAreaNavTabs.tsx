/**
 * MembersAreaNavTabs - Navegação interna da área de membros
 */

import { BookOpen, Users } from "lucide-react";
import type { MembersAreaTabType } from "../layouts/MembersAreaLayout";

interface MembersAreaNavTabsProps {
  currentTab: MembersAreaTabType;
  onTabChange: (tab: MembersAreaTabType) => void;
}

const tabs: { id: MembersAreaTabType; label: string; icon: React.ReactNode }[] = [
  { id: "content", label: "Conteúdo", icon: <BookOpen className="h-4 w-4" /> },
  { id: "students", label: "Alunos", icon: <Users className="h-4 w-4" /> },
];

export function MembersAreaNavTabs({ currentTab, onTabChange }: MembersAreaNavTabsProps) {
  return (
    <div className="flex items-center gap-1 border-b pt-4">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors
            border-b-2 -mb-px
            ${currentTab === tab.id 
              ? "border-primary text-primary" 
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
            }
          `}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
