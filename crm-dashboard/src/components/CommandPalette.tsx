"use client";

import { Command } from "cmdk";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  search,
  parseAIQuery,
  executeAIOperation,
  SearchResults,
  AIParseResult,
} from "@/lib/api";
import { useKeyboardShortcutsContext } from "@/providers/KeyboardShortcutsContext";
import {
  LayoutDashboard,
  Trello,
  Users,
  Settings,
  Plus,
  Moon,
  BarChart3,
  Search,
  DollarSign,
} from "lucide-react";

interface CommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function CommandPalette({
  open: controlledOpen,
  onOpenChange,
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExecuting, setAiExecuting] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResults | null>(
    null,
  );
  const [aiResult, setAiResult] = useState<AIParseResult | null>(null);
  const router = useRouter();
  const { registerShortcut, unregisterShortcut } =
    useKeyboardShortcutsContext();

  // Toggle logic (internal state or controlled)
  const isOpen = controlledOpen ?? open;
  const setIsOpen = onOpenChange ?? setOpen;

  // Register shortcut for Help Menu display
  useEffect(() => {
    registerShortcut({
      key: "⌘K",
      description: "Open Command Menu",
      section: "General",
    });
    return () => unregisterShortcut("⌘K");
  }, [registerShortcut, unregisterShortcut]);

  // Toggle with Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [isOpen, setIsOpen]);

  // Search Logic
  useEffect(() => {
    if (!isOpen || query.length < 2) {
      setSearchResults(null);
      setAiResult(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await search(query);
        setSearchResults(data);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, isOpen]);

  useEffect(() => {
    if (!isOpen || query.length < 2) {
      setAiResult(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setAiLoading(true);
      try {
        const parsed = await parseAIQuery(query);
        setAiResult(parsed);
      } catch (err) {
        console.error("AI parse failed:", err);
      } finally {
        setAiLoading(false);
      }
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [query, isOpen]);

  const handleSelect = useCallback(
    (action: () => void) => {
      action();
      setIsOpen(false);
      setQuery("");
    },
    [setIsOpen],
  );

  const navigate = (path: string) => {
    handleSelect(() => router.push(path));
  };

  const runAiAction = async () => {
    if (!aiResult) return;
    const operation = aiResult.operation as Record<string, unknown>;

    if (
      aiResult.confirmation_needed &&
      !window.confirm(`Execute action?\n\n${aiResult.response}`)
    ) {
      return;
    }

    if (aiResult.intent === "navigation") {
      const destination = String(operation.destination || "").toLowerCase();
      if (destination.includes("dashboard")) navigate("/dashboard");
      else if (destination.includes("pipeline")) navigate("/pipeline");
      else if (destination.includes("lead")) navigate("/leads");
      else if (destination.includes("task")) navigate("/tasks");
      else if (destination.includes("report")) navigate("/reports");
      return;
    }

    if (aiResult.intent !== "action") return;

    setAiExecuting(true);
    try {
      await executeAIOperation(operation);
      setIsOpen(false);
      setQuery("");
      if (String(operation.type || "") === "create_lead") {
        router.push("/leads");
      }
      if (String(operation.type || "") === "move_opportunity_stage") {
        router.push("/pipeline");
      }
    } catch (err) {
      console.error("AI action execution failed:", err);
    } finally {
      setAiExecuting(false);
    }
  };

  return (
    <Command.Dialog
      open={isOpen}
      onOpenChange={setIsOpen}
      label="Command Menu"
      loop
    >
      <div className="flex items-center border-b border-[var(--border-pencil)] px-3">
        <Search className="w-5 h-5 text-[var(--text-muted)] mr-2" />
        <Command.Input
          value={query}
          onValueChange={setQuery}
          placeholder="Type a command or search..."
          className="flex-1"
        />
      </div>

      <Command.List>
        {loading && <Command.Loading>Loading results...</Command.Loading>}

        {!loading && query.length >= 2 && searchResults?.total === 0 && (
          <Command.Empty>No results found.</Command.Empty>
        )}

        {(aiResult || aiLoading) && query.length >= 2 && (
          <Command.Group heading="AI Assistant">
            {aiLoading && (
              <Command.Item disabled value="ai-loading">
                Parsing with AI...
              </Command.Item>
            )}
            {aiResult && (
              <Command.Item
                value={`ai ${aiResult.intent} ${aiResult.response}`}
                onSelect={() => {
                  if (aiResult.intent === "action" || aiResult.intent === "navigation") {
                    runAiAction();
                  }
                }}
              >
                <div className="flex flex-col">
                  <span className="font-bold">
                    {aiResult.intent === "action" || aiResult.intent === "navigation"
                      ? aiExecuting
                        ? "Executing..."
                        : "Run AI Command"
                      : "AI Insight"}
                  </span>
                  <span className="text-xs text-[var(--text-secondary)]">
                    {aiResult.response}
                  </span>
                </div>
              </Command.Item>
            )}
          </Command.Group>
        )}

        {/* Default Actions (when no search query) */}
        {query.length === 0 && (
          <>
            <Command.Group heading="Navigation">
              <Command.Item onSelect={() => navigate("/dashboard")}>
                <LayoutDashboard className="mr-2 w-4 h-4" /> Dashboard
              </Command.Item>
              <Command.Item onSelect={() => navigate("/dashboard")}>
                <BarChart3 className="mr-2 w-4 h-4" /> Go to Analytics
              </Command.Item>
              <Command.Item onSelect={() => navigate("/pipeline")}>
                <Trello className="mr-2 w-4 h-4" /> Pipeline
              </Command.Item>
              <Command.Item onSelect={() => navigate("/leads")}>
                <Users className="mr-2 w-4 h-4" /> Leads
              </Command.Item>
              <Command.Item onSelect={() => navigate("/tasks")}>
                <Trello className="mr-2 w-4 h-4" /> Tasks
              </Command.Item>
              <Command.Item onSelect={() => navigate("/reports")}>
                <BarChart3 className="mr-2 w-4 h-4" /> Reports
              </Command.Item>
              <Command.Item onSelect={() => navigate("/ai")}>
                <Search className="mr-2 w-4 h-4" /> AI Lab
              </Command.Item>
              <Command.Item onSelect={() => navigate("/settings")}>
                <Settings className="mr-2 w-4 h-4" /> Settings
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Actions">
              <Command.Item onSelect={() => navigate("/leads?action=new")}>
                <Plus className="mr-2 w-4 h-4" /> New Lead
              </Command.Item>
              <Command.Item onSelect={() => navigate("/pipeline?action=new")}>
                <Plus className="mr-2 w-4 h-4" /> New Opportunity
              </Command.Item>
              <Command.Item
                onSelect={() => {
                  const newTheme =
                    document.documentElement.getAttribute("data-theme") ===
                    "dark"
                      ? "light"
                      : "dark";
                  document.documentElement.setAttribute("data-theme", newTheme);
                  localStorage.setItem("theme", newTheme);
                  handleSelect(() => {});
                }}
              >
                <Moon className="mr-2 w-4 h-4" /> Toggle Dark/Light Mode
              </Command.Item>
            </Command.Group>
          </>
        )}

        {/* Search Results */}
        {searchResults && (
          <>
            {searchResults.results.leads.length > 0 && (
              <Command.Group heading="Leads">
                {searchResults.results.leads.map((lead) => (
                  <Command.Item
                    key={lead.lead_id}
                    onSelect={() =>
                      navigate(`/leads?highlight=${lead.lead_id}`)
                    }
                    value={`lead ${lead.company_name} ${lead.contact_name}`}
                  >
                    <Users className="mr-2 w-4 h-4 text-[var(--text-muted)]" />
                    <div className="flex flex-col">
                      <span className="font-bold">{lead.company_name}</span>
                      <span className="text-xs text-[var(--text-secondary)]">
                        {lead.contact_name}
                      </span>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
            {searchResults.results.opportunities.length > 0 && (
              <Command.Group heading="Opportunities">
                {searchResults.results.opportunities.map((opp) => (
                  <Command.Item
                    key={opp.opp_id}
                    onSelect={() =>
                      navigate(`/pipeline?highlight=${opp.opp_id}`)
                    }
                    value={`opportunity ${opp.title} ${opp.lead?.company_name}`}
                  >
                    <DollarSign className="mr-2 w-4 h-4 text-[var(--text-muted)]" />
                    <div className="flex flex-col">
                      <span className="font-bold">{opp.title}</span>
                      <span className="text-xs text-[var(--text-secondary)]">
                        {opp.lead?.company_name} • ${opp.value}
                      </span>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </>
        )}
      </Command.List>
    </Command.Dialog>
  );
}
