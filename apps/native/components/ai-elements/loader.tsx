import { View, type ViewProps } from "react-native";
import Svg, { ClipPath, Defs, G, Path, Rect } from "react-native-svg";
import { cn } from "@/lib/utils";

type LoaderIconProps = {
  size?: number;
  color?: string;
};

const LoaderIcon = ({ size = 16, color = "currentColor" }: LoaderIconProps) => (
  <Svg height={size} strokeLinejoin="round" viewBox="0 0 16 16" width={size}>
    <G clipPath="url(#clip0_2393_1490)">
      <Path d="M8 0V4" stroke={color} strokeWidth="1.5" />
      <Path d="M8 16V12" opacity="0.5" stroke={color} strokeWidth="1.5" />
      <Path
        d="M3.29773 1.52783L5.64887 4.7639"
        opacity="0.9"
        stroke={color}
        strokeWidth="1.5"
      />
      <Path
        d="M12.7023 1.52783L10.3511 4.7639"
        opacity="0.1"
        stroke={color}
        strokeWidth="1.5"
      />
      <Path
        d="M12.7023 14.472L10.3511 11.236"
        opacity="0.4"
        stroke={color}
        strokeWidth="1.5"
      />
      <Path
        d="M3.29773 14.472L5.64887 11.236"
        opacity="0.6"
        stroke={color}
        strokeWidth="1.5"
      />
      <Path
        d="M15.6085 5.52783L11.8043 6.7639"
        opacity="0.2"
        stroke={color}
        strokeWidth="1.5"
      />
      <Path
        d="M0.391602 10.472L4.19583 9.23598"
        opacity="0.7"
        stroke={color}
        strokeWidth="1.5"
      />
      <Path
        d="M15.6085 10.4722L11.8043 9.2361"
        opacity="0.3"
        stroke={color}
        strokeWidth="1.5"
      />
      <Path
        d="M0.391602 5.52783L4.19583 6.7639"
        opacity="0.8"
        stroke={color}
        strokeWidth="1.5"
      />
    </G>
    <Defs>
      <ClipPath id="clip0_2393_1490">
        <Rect fill="white" height="16" width="16" />
      </ClipPath>
    </Defs>
  </Svg>
);

export type LoaderProps = ViewProps & {
  size?: number;
};

export const Loader = ({ className, size = 16, ...props }: LoaderProps) => (
  <View
    className={cn(
      "inline-flex animate-spin items-center justify-center",
      className
    )}
    {...props}
  >
    <LoaderIcon size={size} />
  </View>
);
