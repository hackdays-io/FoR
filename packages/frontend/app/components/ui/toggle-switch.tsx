import * as React from "react";

import { cn } from "~/lib/utils";

export const toggleSwitchState = {
	on: "on",
	off: "off",
	disabled: "disabled",
} as const;

export type ToggleSwitchState =
	(typeof toggleSwitchState)[keyof typeof toggleSwitchState];

export interface ToggleSwitchProps
	extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "disabled"> {
	defaultState?: ToggleSwitchState;
	disabled?: boolean;
	leftLabel?: React.ReactNode;
	label?: React.ReactNode;
	onColor?: string;
	onStateChange?: (nextState: Exclude<ToggleSwitchState, "disabled">) => void;
	rightLabel?: React.ReactNode;
	state?: ToggleSwitchState;
}

export const ToggleSwitch = React.forwardRef<
	HTMLButtonElement,
	ToggleSwitchProps
>(
	(
		{
			className,
			defaultState = toggleSwitchState.off,
			disabled = false,
			id,
			leftLabel,
			label,
			onClick,
			onColor = "var(--color-visual-green-3)",
			onStateChange,
			rightLabel,
			state,
			type = "button",
			...props
		},
		ref,
	) => {
		const generatedId = React.useId();
		const switchId = id ?? generatedId;
		const leftLabelId = `${switchId}-left-label`;
		const rightLabelId = `${switchId}-right-label`;
		const resolvedRightLabel = rightLabel ?? label;
		const labelledBy = [leftLabel ? leftLabelId : null, resolvedRightLabel ? rightLabelId : null]
			.filter(Boolean)
			.join(" ") || undefined;
		const isControlled = state !== undefined;
		const [uncontrolledState, setUncontrolledState] =
			React.useState<ToggleSwitchState>(defaultState);

		const resolvedState = isControlled ? state : uncontrolledState;
		const isStateDisabled = resolvedState === toggleSwitchState.disabled;
		const isDisabled = disabled || isStateDisabled;
		const checked = resolvedState === toggleSwitchState.on;

		const handleToggle = React.useCallback(() => {
			if (isDisabled) {
				return;
			}

			const nextState: Exclude<ToggleSwitchState, "disabled"> = checked
				? toggleSwitchState.off
				: toggleSwitchState.on;

			if (!isControlled) {
				setUncontrolledState(nextState);
			}

			onStateChange?.(nextState);
		}, [checked, isControlled, isDisabled, onStateChange]);

		return (
			<div className="inline-flex items-center gap-8" data-slot="toggle-switch">
				{leftLabel ? (
					<button
						className={cn(
							"inline-block align-middle font-ui text-ui-13 text-foreground",
							"outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
							!isDisabled && "cursor-pointer",
							isDisabled && "cursor-not-allowed text-muted-foreground",
						)}
						disabled={isDisabled}
						id={leftLabelId}
						onClick={handleToggle}
						type="button"
					>
						{leftLabel}
					</button>
				) : null}

				<button
					aria-checked={checked}
					aria-disabled={isDisabled || undefined}
					aria-labelledby={labelledBy}
					className={cn(
						"relative inline-flex h-28 w-48 shrink-0 items-center rounded-full border px-2",
						"outline-none transition-[background-color,border-color] duration-200",
						"focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
						checked ? "justify-end border-transparent" : "justify-start border-border bg-text-hint",
						!isDisabled && "cursor-pointer",
						isDisabled && "cursor-not-allowed border-border bg-muted opacity-60",
						className,
					)}
					disabled={isDisabled}
					id={switchId}
					onClick={(event) => {
						onClick?.(event);
						if (event.defaultPrevented) {
							return;
						}

						handleToggle();
					}}
					ref={ref}
					role="switch"
					style={checked ? { backgroundColor: onColor } : undefined}
					type={type}
					{...props}
				>
					<span
						aria-hidden="true"
						className={cn(
							"inline-block size-24 rounded-full bg-card",
							"shadow-elevation-1 transition-transform duration-200",
						)}
					/>
				</button>

				{resolvedRightLabel ? (
					<button
						className={cn(
							"inline-block align-middle font-ui text-ui-13 text-foreground",
							"outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
							!isDisabled && "cursor-pointer",
							isDisabled && "cursor-not-allowed text-muted-foreground",
						)}
						disabled={isDisabled}
						id={rightLabelId}
						onClick={handleToggle}
						type="button"
					>
						{resolvedRightLabel}
					</button>
				) : null}
			</div>
		);
	},
);

ToggleSwitch.displayName = "ToggleSwitch";
