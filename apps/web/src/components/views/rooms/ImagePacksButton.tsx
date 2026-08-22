/*
Copyright 2026 Element Creations Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE in the repository root for full details.
*/

import React, { useRef } from "react";

import { CollapsibleButton } from "../../../components/views/rooms/CollapsibleButton";
import { type MenuProps } from "../../structures/ContextMenu";
import ContextMenu, { ChevronFace, aboveLeftOf, useContextMenu } from "../../structures/ContextMenu";
import StickerIcon from "@vector-im/compound-design-tokens/icons/sticker.svg?react";
import ImagePacksPicker from "./ImagePacksPicker";
import { useScopedRoomContext } from "../../../contexts/ScopedRoomContext";

interface IProps {
    menuPosition?: MenuProps;
}

export const ImagePacksButton: React.FC<IProps> = ({ menuPosition }) => {
    const buttonRef = useRef<HTMLDivElement>(null);
    const [menuDisplayed, button, openMenu, closeMenu] = useContextMenu<HTMLDivElement>();
    const roomContext = useScopedRoomContext("room");
    const room = roomContext?.room;

    if (!room) return null;

    let position;
    if (menuPosition) {
        position = menuPosition;
    } else if (buttonRef.current) {
        position = aboveLeftOf(buttonRef.current.getBoundingClientRect());
    }

    return (
        <React.Fragment>
            <CollapsibleButton
                className="mx_MessageComposer_button"
                id="mx_ImagePacksButton"
                onClick={openMenu}
                title={"Stickers & Emotes"}
                inputRef={button}
            >
                <StickerIcon />
            </CollapsibleButton>
            {menuDisplayed && position && (
                <ContextMenu
                    {...position}
                    chevronFace={ChevronFace.None}
                    onFinished={closeMenu}
                    menuWidth={350}
                    menuHeight={400}
                >
                    <ImagePacksPicker room={room} onFinished={closeMenu} />
                </ContextMenu>
            )}
        </React.Fragment>
    );
};

export default ImagePacksButton;
