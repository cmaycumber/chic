import type { UIMessage } from "ai";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import type { ReactElement } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { Platform, View, type ViewProps } from "react-native";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

type BranchContextType = {
  currentBranch: number;
  totalBranches: number;
  goToPrevious: () => void;
  goToNext: () => void;
  branches: ReactElement[];
  setBranches: (branches: ReactElement[]) => void;
};

const BranchContext = createContext<BranchContextType | null>(null);

const useBranch = () => {
  const context = useContext(BranchContext);

  if (!context) {
    throw new Error("Branch components must be used within Branch");
  }

  return context;
};

export type BranchProps = ViewProps & {
  defaultBranch?: number;
  onBranchChange?: (branchIndex: number) => void;
};

export const Branch = ({
  defaultBranch = 0,
  onBranchChange,
  className,
  ...props
}: BranchProps) => {
  const [currentBranch, setCurrentBranch] = useState(defaultBranch);
  const [branches, setBranches] = useState<ReactElement[]>([]);

  const handleBranchChange = (newBranch: number) => {
    setCurrentBranch(newBranch);
    onBranchChange?.(newBranch);
  };

  const goToPrevious = () => {
    const newBranch =
      currentBranch > 0 ? currentBranch - 1 : branches.length - 1;
    handleBranchChange(newBranch);
  };

  const goToNext = () => {
    const newBranch =
      currentBranch < branches.length - 1 ? currentBranch + 1 : 0;
    handleBranchChange(newBranch);
  };

  const contextValue: BranchContextType = {
    currentBranch,
    totalBranches: branches.length,
    goToPrevious,
    goToNext,
    branches,
    setBranches,
  };

  return (
    <BranchContext.Provider value={contextValue}>
      <View
        className={cn("grid w-full gap-2 [&>div]:pb-0", className)}
        {...props}
      />
    </BranchContext.Provider>
  );
};

export type BranchMessagesProps = ViewProps;

export const BranchMessages = ({ children, ...props }: BranchMessagesProps) => {
  const { currentBranch, setBranches, branches } = useBranch();
  const childrenArray = Array.isArray(children) ? children : [children];

  // Use useEffect to update branches when they change
  useEffect(() => {
    if (branches.length !== childrenArray.length) {
      setBranches(childrenArray);
    }
  }, [childrenArray, branches, setBranches]);

  return childrenArray.map((branch, index) => (
    <View
      className={cn(
        "grid gap-2 overflow-hidden [&>div]:pb-0",
        index === currentBranch ? "flex" : "hidden"
      )}
      key={branch.key}
      {...props}
    >
      {branch}
    </View>
  ));
};

export type BranchSelectorProps = ViewProps & {
  from: UIMessage["role"];
};

export const BranchSelector = ({
  className,
  from,
  ...props
}: BranchSelectorProps) => {
  const { totalBranches } = useBranch();

  // Don't render if there's only one branch
  if (totalBranches <= 1) {
    return null;
  }

  return (
    <View
      className={cn(
        "flex flex-row items-center gap-2 self-end px-10",
        from === "assistant" ? "justify-start" : "justify-end",
        className
      )}
      {...props}
    />
  );
};

export type BranchPreviousProps = ButtonProps;

export const BranchPrevious = ({
  className,
  children,
  ...props
}: BranchPreviousProps) => {
  const { goToPrevious, totalBranches } = useBranch();

  return (
    <Button
      accessibilityLabel="Previous branch"
      className={cn(
        "size-7 shrink-0 rounded-full text-muted-foreground",
        Platform.select({
          web: "transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none",
        }),
        "disabled:opacity-50",
        className
      )}
      disabled={totalBranches <= 1}
      onPress={goToPrevious}
      size="icon"
      variant="ghost"
      {...props}
    >
      {children ?? <ChevronLeft size={14} />}
    </Button>
  );
};

export type BranchNextProps = ButtonProps;

export const BranchNext = ({
  className,
  children,
  ...props
}: BranchNextProps) => {
  const { goToNext, totalBranches } = useBranch();

  return (
    <Button
      accessibilityLabel="Next branch"
      className={cn(
        "size-7 shrink-0 rounded-full text-muted-foreground",
        Platform.select({
          web: "transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none",
        }),
        "disabled:opacity-50",
        className
      )}
      disabled={totalBranches <= 1}
      onPress={goToNext}
      size="icon"
      variant="ghost"
      {...props}
    >
      {children ?? <ChevronRight size={14} />}
    </Button>
  );
};

export type BranchPageProps = ViewProps;

export const BranchPage = ({ className, ...props }: BranchPageProps) => {
  const { currentBranch, totalBranches } = useBranch();

  return (
    <Text
      className={cn(
        "font-medium text-muted-foreground text-xs tabular-nums",
        className
      )}
      {...props}
    >
      {currentBranch + 1} of {totalBranches}
    </Text>
  );
};
