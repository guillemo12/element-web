/*
Copyright 2026 Element Creations Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE in the repository root for full details.
*/

import { AsyncStoreWithClient } from "../AsyncStoreWithClient";
import defaultDispatcher from "../../dispatcher/dispatcher";
import { type ActionPayload } from "../../dispatcher/payloads";

export const IMAGE_PACK_ROOM_EVENT_TYPE = "m.room.image_pack";
export const IMAGE_PACK_ACCOUNT_EVENT_TYPE = "m.image_pack.rooms";

export interface ImagePackImage {
    url: string;
    info?: {
        mimetype?: string;
        w?: number;
        h?: number;
        size?: number;
    };
    body?: string;
}

export interface ImagePack {
    images: Record<string, ImagePackImage>;
    pack?: {
        display_name?: string;
        avatar_url?: string;
        usage?: string[];
    };
}

export class ImagePackStore extends AsyncStoreWithClient<unknown> {
    private static internalInstance: ImagePackStore;

    public constructor() {
        super(defaultDispatcher);
    }

    public static get instance(): ImagePackStore {
        if (!ImagePackStore.internalInstance) {
            ImagePackStore.internalInstance = new ImagePackStore();
        }
        return ImagePackStore.internalInstance;
    }

    protected async onAction(payload: ActionPayload): Promise<void> {}

    protected async onReady(): Promise<void> {}

    public getRoomImagePacks(roomId: string): { id: string, pack: ImagePack }[] {
        const client = this.matrixClient;
        if (!client) return [];

        const room = client.getRoom(roomId);
        if (!room) return [];

        const events = room.currentState.getStateEvents(IMAGE_PACK_ROOM_EVENT_TYPE);
        return events.map(ev => ({
            id: ev.getStateKey()!,
            pack: ev.getContent<ImagePack>()
        }));
    }

    public getGlobalImagePacks(): { id: string, pack: ImagePack, roomId: string }[] {
        const client = this.matrixClient;
        if (!client) return [];

        const accountDataEvent = client.getAccountData(IMAGE_PACK_ACCOUNT_EVENT_TYPE as any);
        if (!accountDataEvent) return [];

        const data = accountDataEvent.getContent<Record<string, Record<string, any>>>();
        const globalPacks: { id: string, pack: ImagePack, roomId: string }[] = [];

        for (const [roomId, states] of Object.entries(data)) {
            const room = client.getRoom(roomId);
            if (!room) continue;

            for (const stateKey of Object.keys(states)) {
                const event = room.currentState.getStateEvents(IMAGE_PACK_ROOM_EVENT_TYPE, stateKey);
                if (event) {
                    globalPacks.push({
                        roomId,
                        id: stateKey,
                        pack: event.getContent<ImagePack>()
                    });
                }
            }
        }
        return globalPacks;
    }

    public async createOrUpdateRoomPack(roomId: string, stateKey: string, packData: ImagePack): Promise<void> {
        const client = this.matrixClient;
        if (!client) return;

        await client.sendStateEvent(roomId, IMAGE_PACK_ROOM_EVENT_TYPE as any, packData, stateKey);
    }
}
