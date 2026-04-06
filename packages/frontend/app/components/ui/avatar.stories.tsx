import "~/app.css";
import avatarMock from "~/assets/images/avatar-mock.png";
import { Avatar, AvatarUpload } from "~/components/ui/avatar";

export default {
  title: "Components/Avatar",
};

function StoryFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background p-24">
      <div className="mx-auto flex max-w-[480px] flex-col gap-24">
        {children}
      </div>
    </div>
  );
}

export const Sizes = () => {
  return (
    <StoryFrame>
      <div className="flex items-center gap-16">
        <div className="flex flex-col items-center gap-8">
          <Avatar size="sm" />
          <span className="text-ui-12 text-text-secondary">sm</span>
        </div>
        <div className="flex flex-col items-center gap-8">
          <Avatar size="md" />
          <span className="text-ui-12 text-text-secondary">md</span>
        </div>
        <div className="flex flex-col items-center gap-8">
          <Avatar size="lg" />
          <span className="text-ui-12 text-text-secondary">lg</span>
        </div>
      </div>
    </StoryFrame>
  );
};

Sizes.storyName = "Sizes";

export const WithImage = () => {
  return (
    <StoryFrame>
      <div className="flex items-center gap-16">
        <Avatar
          size="sm"
          src={avatarMock}
          alt="ユーザーA"
        />
        <Avatar
          size="md"
          src={avatarMock}
          alt="ユーザーB"
        />
        <Avatar
          size="lg"
          src={avatarMock}
          alt="ユーザーC"
        />
      </div>
    </StoryFrame>
  );
};

WithImage.storyName = "With Image";

export const Fallback = () => {
  return (
    <StoryFrame>
      <div className="flex items-center gap-16">
        <div className="flex flex-col items-center gap-8">
          <Avatar size="sm" />
          <span className="text-ui-12 text-text-secondary">src なし</span>
        </div>
        <div className="flex flex-col items-center gap-8">
          <Avatar size="md" src="" />
          <span className="text-ui-12 text-text-secondary">空文字</span>
        </div>
      </div>
    </StoryFrame>
  );
};

Fallback.storyName = "Fallback (Default Image)";

export const BrokenImageFallback = () => {
  return (
    <StoryFrame>
      <div className="flex items-center gap-16">
        <div className="flex flex-col items-center gap-8">
          <Avatar size="md" src="/avatar-missing.png" />
          <span className="text-ui-12 text-text-secondary">
            壊れた画像 (default)
          </span>
        </div>
        <div className="flex flex-col items-center gap-8">
          <Avatar
            src="/avatar-missing.png"
            size="lg"
          />
          <span className="text-ui-12 text-text-secondary">
            壊れた画像 (default)
          </span>
        </div>
      </div>
    </StoryFrame>
  );
};

BrokenImageFallback.storyName = "Fallback (Broken Image)";

export const Upload = () => {
  return (
    <StoryFrame>
      <div className="flex items-center gap-24">
        <div className="flex flex-col items-center gap-8">
          <AvatarUpload />
          <span className="text-ui-12 text-text-secondary">未選択</span>
        </div>
        <div className="flex flex-col items-center gap-8">
          <AvatarUpload
            src={avatarMock}
            alt="アップロード済み"
          />
          <span className="text-ui-12 text-text-secondary">画像あり</span>
        </div>
      </div>
    </StoryFrame>
  );
};

Upload.storyName = "AvatarUpload";
