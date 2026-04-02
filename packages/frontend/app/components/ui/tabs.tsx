import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "~/lib/utils";

type TabsVariant = "default" | "underline";

const TabsVariantContext = React.createContext<TabsVariant>("default");

interface TabsProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
  variant?: TabsVariant;
}

const Tabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  TabsProps
>(({ variant = "default", ...props }, ref) => (
  <TabsVariantContext.Provider value={variant}>
    <TabsPrimitive.Root {...props} ref={ref} />
  </TabsVariantContext.Provider>
));
Tabs.displayName = "Tabs";

const tabsListStyles: Record<TabsVariant, string> = {
  default:
    "inline-flex w-full items-center justify-start gap-2 rounded-md bg-muted p-2 text-muted-foreground",
  underline:
    "flex w-full border-b border-border bg-transparent",
};

const tabsTriggerStyles: Record<TabsVariant, string> = {
  default:
    "inline-flex items-center justify-center whitespace-nowrap rounded-md px-12 py-6 text-ui-13 font-bold text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background bg-transparent data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-elevation-1 disabled:opacity-50 disabled:cursor-not-allowed",
  underline:
    "flex-1 items-center justify-center whitespace-nowrap h-56 text-ui-13 font-bold text-text-hint transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background bg-transparent border-b-2 border-transparent data-[state=active]:border-text-hint data-[state=active]:text-foreground disabled:opacity-50 disabled:cursor-not-allowed",
};

interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  variant?: TabsVariant;
}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ variant, className, ...props }, ref) => {
  const contextVariant = React.useContext(TabsVariantContext);
  const appliedVariant = variant ?? contextVariant;

  return (
    <TabsVariantContext.Provider value={appliedVariant}>
      <TabsPrimitive.List
        {...props}
        ref={ref}
        className={cn(tabsListStyles[appliedVariant], className)}
      />
    </TabsVariantContext.Provider>
  );
});
TabsList.displayName = "TabsList";

interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  variant?: TabsVariant;
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ variant, className, ...props }, ref) => {
  const contextVariant = React.useContext(TabsVariantContext);
  const appliedVariant = variant ?? contextVariant;

  return (
    <TabsPrimitive.Trigger
      {...props}
      ref={ref}
      className={cn(tabsTriggerStyles[appliedVariant], className)}
    />
  );
});
TabsTrigger.displayName = "TabsTrigger";

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>((props, ref) => (
  <TabsPrimitive.Content
    {...props}
    ref={ref}
    className={cn(
      "mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      props.className,
    )}
  />
));
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
