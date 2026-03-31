import * as React from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

export default {
  title: "Components/Tabs",
};

const TabContent = ({ value, children }: { value: string; children: React.ReactNode }) => (
  <TabsContent value={value}>
    <p className="text-content-body-m text-foreground">{children}</p>
  </TabsContent>
);

export const Default = () => (
  <div className="w-full max-w-3xl space-y-8 p-8">
    <Tabs defaultValue="tab-1" className="w-full">
      <TabsList>
        <TabsTrigger value="tab-1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab-2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab-3" disabled>
          Tab 3 (disabled)
        </TabsTrigger>
      </TabsList>
      <TabContent value="tab-1">
        Tab 1 is active. Use this area to surface quick contextual details or
        status for the selected tab.
      </TabContent>
      <TabContent value="tab-2">
        Tab 2 is active. Provide alternative content, imagery, or supportive copy here.
      </TabContent>
      <TabContent value="tab-3">
        Tab 3 is disabled, so this content should not render unless the variant changes.
      </TabContent>
    </Tabs>
  </div>
);

export const Underline = () => (
  <div className="w-full max-w-3xl space-y-8 p-8">
    <Tabs defaultValue="tab-1" variant="underline" className="w-full">
      <TabsList>
        <TabsTrigger value="tab-1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab-2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab-3" disabled>
          Tab 3 (disabled)
        </TabsTrigger>
      </TabsList>
      <TabContent value="tab-1">
        Tab 1 is active. Use this area to surface quick contextual details or
        status for the selected tab.
      </TabContent>
      <TabContent value="tab-2">
        Tab 2 is active. Provide alternative content, imagery, or supportive copy here.
      </TabContent>
      <TabContent value="tab-3">
        Tab 3 is disabled, so this content should not render unless the variant changes.
      </TabContent>
    </Tabs>
  </div>
);
