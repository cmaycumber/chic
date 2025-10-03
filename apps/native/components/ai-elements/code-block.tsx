import * as Clipboard from "expo-clipboard";
import { Check, Copy } from "lucide-react-native";
import type { ReactNode } from "react";
import { createContext, useContext, useState } from "react";
import { Platform, ScrollView, View, type ViewProps } from "react-native";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

type CodeBlockContextType = {
  code: string;
};

const CodeBlockContext = createContext<CodeBlockContextType>({
  code: "",
});

export type CodeBlockProps = ViewProps & {
  code: string;
  language: string;
  showLineNumbers?: boolean;
  children?: ReactNode;
};

export const CodeBlock = ({
  code,
  language,
  showLineNumbers = false,
  className,
  children,
  ...props
}: CodeBlockProps) => (
  <CodeBlockContext.Provider value={{ code }}>
    <View
      className={cn(
        "relative w-full overflow-hidden rounded-md border bg-background",
        className
      )}
      {...props}
    >
      <View className="relative">
        <ScrollView
          className="overflow-hidden"
          horizontal
          showsHorizontalScrollIndicator={Platform.OS === "web"}
        >
          <Text className="p-4 font-mono text-foreground text-sm" selectable>
            {code}
          </Text>
        </ScrollView>
        {children && (
          <View className="absolute top-2 right-2 flex flex-row items-center gap-2">
            {children}
          </View>
        )}
      </View>
    </View>
  </CodeBlockContext.Provider>
);

export type CodeBlockCopyButtonProps = ButtonProps & {
  onCopy?: () => void;
  onError?: (error: Error) => void;
  timeout?: number;
};

export const CodeBlockCopyButton = ({
  onCopy,
  onError,
  timeout = 2000,
  children,
  className,
  ...props
}: CodeBlockCopyButtonProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const { code } = useContext(CodeBlockContext);

  const copyToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(code);
      setIsCopied(true);
      onCopy?.();
      setTimeout(() => setIsCopied(false), timeout);
    } catch (error) {
      onError?.(error as Error);
    }
  };

  const Icon = isCopied ? Check : Copy;

  return (
    <Button
      className={cn("shrink-0", className)}
      onPress={copyToClipboard}
      size="icon"
      variant="ghost"
      {...props}
    >
      {children ?? <Icon size={14} />}
    </Button>
  );
};
