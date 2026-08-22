import React from "react";
import { render, screen, waitFor } from "../../../../../test-utils";
import userEvent from "@testing-library/user-event";
import { Room } from "matrix-js-sdk/src/matrix";
import { ImagePacksButton } from "../../../../../src/components/views/rooms/ImagePacksButton";
import RoomContext from "../../../../../src/contexts/RoomContext";

describe("ImagePacksButton", () => {
    let mockRoom: Room;

    beforeEach(() => {
        mockRoom = {
            roomId: "!room:example.org",
        } as unknown as Room;
    });

    const getWrapper = (room: Room | undefined = mockRoom) => {
        const roomContextValue = {
            room,
            roomId: room?.roomId,
        } as any;

        return (
            <RoomContext.Provider value={roomContextValue}>
                <ImagePacksButton menuPosition={undefined} />
            </RoomContext.Provider>
        );
    };

    it("renders the button if there is a room", () => {
        render(getWrapper());
        expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("does not render if there is no room", () => {
        const { container } = render(getWrapper(undefined));
        expect(container.firstChild).toBeNull();
    });

    it("opens the context menu when clicked", async () => {
        render(getWrapper());
        const button = screen.getByRole("button");
        await userEvent.click(button);

        // Wait for the context menu to appear
        await waitFor(() => {
            expect(screen.getByText("Stickers & Emotes")).toBeInTheDocument();
        });
    });
});
