/*
Copyright 2026 Element Creations Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE in the repository root for full details.
*/

import { mediaFromMxc } from "../../../customisations/Media";
/*
Copyright 2026 Element Creations Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE in the repository root for full details.
*/

import React, { useState, useEffect } from "react";
import { type Room } from "matrix-js-sdk/src/matrix";

import BaseDialog from "./BaseDialog";
import { MatrixClientPeg } from "../../../MatrixClientPeg";
import { ImagePackStore, type ImagePack } from "../../../stores/image-packs/ImagePackStore";
import AccessibleButton from "../elements/AccessibleButton";

interface IProps {
    room: Room;
    onFinished: () => void;
}

export const ManageImagePacksDialog: React.FC<IProps> = ({ room, onFinished }) => {
    const [packs, setPacks] = useState<{ id: string, pack: ImagePack }[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingPackId, setEditingPackId] = useState<string | null>(null);


    const loadPacks = React.useCallback((): void => {
        const store = ImagePackStore.instance;
        const roomPacks = store.getRoomImagePacks(room.roomId);
        setPacks(roomPacks);
    }, [room.roomId]);

    useEffect(() => {
        loadPacks();
    }, [room, loadPacks]);

    const handleCreatePack = async (): Promise<void> => {
        setLoading(true);
        try {
            const store = ImagePackStore.instance;
            const newPackId = "pack_" + Date.now();
            const newPack: ImagePack = {
                images: {},
                pack: {
                    display_name: "New Pack",
                    usage: ["sticker", "emoticon"],
                }
            };
            await store.createOrUpdateRoomPack(room.roomId, newPackId, newPack);
            loadPacks();
            setEditingPackId(newPackId);
        } catch (e) {
            console.error("Failed to create pack", e);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, packId: string): Promise<void> => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setLoading(true);
        try {
            const store = ImagePackStore.instance;

            const currentPackData = packs.find(p => p.id === packId)?.pack;
            if (!currentPackData) return;

            // Clone images to mutate
            const updatedImages = { ...currentPackData.images };

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                // Upload to Matrix media repo
                const uploadPromise = MatrixClientPeg.safeGet().uploadContent(file, {
                    includeFilename: false
                });
                const response = await uploadPromise;

                const shortcode = file.name.split('.')[0].replace(/[^a-zA-Z0-9_-]/g, '');

                updatedImages[shortcode] = {
                    url: response.content_uri,
                    body: shortcode,
                    info: {
                        mimetype: file.type,
                        size: file.size,
                    }
                };
            }

            const updatedPack: ImagePack = {
                ...currentPackData,
                images: updatedImages,
            };

            await store.createOrUpdateRoomPack(room.roomId, packId, updatedPack);
            loadPacks();
        } catch (e) {
            console.error("Failed to upload image", e);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteImage = async (packId: string, shortcode: string): Promise<void> => {
        setLoading(true);
        try {
            const store = ImagePackStore.instance;
            const currentPackData = packs.find(p => p.id === packId)?.pack;
            if (!currentPackData) return;

            const updatedImages = { ...currentPackData.images };
            delete updatedImages[shortcode];

            const updatedPack: ImagePack = {
                ...currentPackData,
                images: updatedImages,
            };

            await store.createOrUpdateRoomPack(room.roomId, packId, updatedPack);
            loadPacks();
        } catch (e) {
            console.error("Failed to delete image", e);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePack = async (packId: string): Promise<void> => {
        setLoading(true);
        try {
            // MSC2545: To remove a pack, we just send an empty event
            await MatrixClientPeg.safeGet().sendStateEvent(room.roomId, "m.room.image_pack" as any, {}, packId);
            if (editingPackId === packId) setEditingPackId(null);
            loadPacks();
        } catch (e) {
            console.error("Failed to delete pack", e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <BaseDialog
            className="mx_ManageImagePacksDialog"
            onFinished={onFinished}
            title={"Stickers & Emotes"}
        >
            <div className="mx_Dialog_content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p>{"Stickers & Emotes"}</p>

                <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: '300px' }}>
                    {/* Left Sidebar: Pack List */}
                    <div style={{ width: '30%', borderRight: '1px solid var(--cpd-color-border-interactive-secondary)', paddingRight: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h4 style={{ margin: 0 }}>{"Stickers & Emotes"}</h4>
                            <AccessibleButton
                                kind="primary"
                                onClick={handleCreatePack}
                                disabled={loading}
                                style={{ padding: '4px 8px' }}
                            >
                                +
                            </AccessibleButton>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {packs.length === 0 && <span style={{fontSize: '12px', color: 'gray'}}>{"Stickers & Emotes"}</span>}
                            {packs.map(p => (
                                <AccessibleButton
                                    key={p.id}
                                    onClick={() => setEditingPackId(p.id)}
                                    style={{
                                        padding: '8px',
                                        border: '1px solid var(--cpd-color-border-interactive-secondary)',
                                        borderRadius: '4px',
                                        background: editingPackId === p.id ? 'var(--cpd-color-bg-subtle-secondary)' : 'transparent',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {p.pack.pack?.display_name || p.id}
                                </AccessibleButton>
                            ))}
                        </div>
                    </div>

                    {/* Right Area: Pack Editor */}
                    <div style={{ width: '70%', paddingLeft: '8px', overflowY: 'auto' }}>
                        {!editingPackId ? (
                            <p style={{ color: 'gray' }}>{"Stickers & Emotes"}</p>
                        ) : (
                            <div>
                                {packs.filter(p => p.id === editingPackId).map(p => (
                                    <div key={p.id}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                            <h3 style={{ margin: 0 }}>{p.pack.pack?.display_name || p.id}</h3>
                                            <div>
                                                <input
                                                    type="file"
                                                    id={`upload-${p.id}`}
                                                    style={{ display: 'none' }}
                                                    multiple
                                                    accept="image/*"
                                                    onChange={(e) => handleFileUpload(e, p.id)}
                                                    disabled={loading}
                                                />
                                                <AccessibleButton
                                                    kind="primary_outline"
                                                    onClick={() => document.getElementById(`upload-${p.id}`)?.click()}
                                                    disabled={loading}
                                                    style={{ marginRight: '8px' }}
                                                >
                                                    {"Stickers & Emotes"}
                                                </AccessibleButton>
                                                <AccessibleButton
                                                    kind="danger_outline"
                                                    onClick={() => handleDeletePack(p.id)}
                                                    disabled={loading}
                                                >
                                                    {"Stickers & Emotes"}
                                                </AccessibleButton>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '12px' }}>
                                            {Object.entries(p.pack.images || {}).map(([shortcode, image]) => {
                                                const src = mediaFromMxc(image.url).srcHttp;
                                                return (
                                                    <div key={shortcode} style={{ position: 'relative', border: '1px solid #ddd', padding: '4px', borderRadius: '4px', textAlign: 'center' }}>
                                                        {src && <img src={src} style={{ width: '100%', aspectRatio: '1', objectFit: 'contain' }} alt={image.body || shortcode} />}
                                                        <span style={{ display: 'block', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{shortcode}</span>
                                                        <AccessibleButton
                                                            onClick={() => handleDeleteImage(p.id, shortcode)}
                                                            disabled={loading}
                                                            style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', borderRadius: '50%', width: '20px', height: '20px', lineHeight: '18px', textAlign: 'center', cursor: 'pointer', fontSize: '12px' }}
                                                        >
                                                            &times;
                                                        </AccessibleButton>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </BaseDialog>
    );
};

export default ManageImagePacksDialog;
