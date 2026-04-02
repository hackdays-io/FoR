import * as React from "react";

import "~/app.css";
import {
  ToggleSwitch,
  toggleSwitchState,
  type ToggleSwitchState,
} from "~/components/ui/toggle-switch";

export default {
  title: "Components/ToggleSwitch",
};

type StoryFrameProps = {
  children: React.ReactNode;
};

function StoryFrame({ children }: StoryFrameProps) {
  return (
    <div className="min-h-screen bg-background p-24">
      <div className="mx-auto flex max-w-[480px] flex-col gap-20">{children}</div>
    </div>
  );
}

function ControlledPreview() {
  const [state, setState] = React.useState<ToggleSwitchState>(toggleSwitchState.off);

  return (
    <div className="flex flex-col gap-8">
      <ToggleSwitch label="通知を受け取る" state={state} onStateChange={setState} />
      <p className="text-ui-12 text-muted-foreground">Current: {state}</p>
    </div>
  );
}

export const States = () => {
  return (
    <StoryFrame>
      <ToggleSwitch defaultState={toggleSwitchState.off} label="オフ" />
      <ToggleSwitch defaultState={toggleSwitchState.on} label="オン" />
      <ToggleSwitch defaultState={toggleSwitchState.disabled} label="無効" />
    </StoryFrame>
  );
};

States.storyName = "OffOnDisabled";

export const Controlled = () => {
  return (
    <StoryFrame>
      <ControlledPreview />
    </StoryFrame>
  );
};

Controlled.storyName = "Controlled";

export const CustomOnColor = () => {
  return (
    <StoryFrame>
      <ToggleSwitch
        defaultState={toggleSwitchState.on}
        label="カスタムカラー"
        onColor="var(--color-visual-red-3)"
      />
    </StoryFrame>
  );
};

CustomOnColor.storyName = "Custom On Color";

export const LeftAndRightLabels = () => {
  return (
    <StoryFrame>
      <ToggleSwitch
        defaultState={toggleSwitchState.on}
        leftLabel="受け取らない"
        rightLabel="受け取る"
      />
    </StoryFrame>
  );
};

LeftAndRightLabels.storyName = "Left Right Labels";

export const LeftLabelOnly = () => {
  return (
    <StoryFrame>
      <ToggleSwitch defaultState={toggleSwitchState.off} leftLabel="通知" />
    </StoryFrame>
  );
};

LeftLabelOnly.storyName = "Left Label Only";

export const RightLabelOnly = () => {
  return (
    <StoryFrame>
      <ToggleSwitch defaultState={toggleSwitchState.on} rightLabel="通知" />
    </StoryFrame>
  );
};

RightLabelOnly.storyName = "Right Label Only";

export const Disabled = () => {
  return (
    <StoryFrame>
      <ToggleSwitch
        defaultState={toggleSwitchState.on}
        disabled
        leftLabel="受け取らない"
        rightLabel="受け取る"
      />
    </StoryFrame>
  );
};

Disabled.storyName = "Disabled";
