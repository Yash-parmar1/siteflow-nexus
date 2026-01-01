import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Camera,
  Video,
  FileText,
  Plus,
  Download,
  Expand,
  Calendar,
  User,
  MapPin,
  X,
  Image as ImageIcon,
} from "lucide-react";
import type { MediaEvidence, DocumentEvidence } from "@/types/asset";

interface EvidenceGalleryProps {
  photos: MediaEvidence[];
  videos: MediaEvidence[];
  documents: DocumentEvidence[];
  readOnly?: boolean;
  onUpload?: (type: "photo" | "video" | "document") => void;
}

export function EvidenceGallery({
  photos,
  videos,
  documents,
  readOnly = false,
  onUpload,
}: EvidenceGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<MediaEvidence | null>(null);
  const [activeTab, setActiveTab] = useState<"photos" | "videos" | "documents">("photos");

  const tabs = [
    { id: "photos", label: "Photos", count: photos.length, icon: Camera },
    { id: "videos", label: "Videos", count: videos.length, icon: Video },
    { id: "documents", label: "Documents", count: documents.length, icon: FileText },
  ];

  const totalItems = photos.length + videos.length + documents.length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                activeTab === tab.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <Badge variant="secondary" className="ml-1 text-xs">
                {tab.count}
              </Badge>
            </button>
          ))}
        </div>

        {!readOnly && onUpload && (
          <Button variant="outline" size="sm" onClick={() => onUpload(activeTab.slice(0, -1) as any)}>
            <Plus className="w-4 h-4 mr-1" />
            Upload
          </Button>
        )}
      </div>

      {/* Photos Grid */}
      {activeTab === "photos" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {photos.map((photo) => (
            <button
              key={photo.id}
              onClick={() => setSelectedImage(photo)}
              className="group relative aspect-square rounded-lg overflow-hidden bg-secondary/50 border border-border/50 hover:border-primary/50 transition-all"
            >
              {/* Placeholder for actual image */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-secondary to-muted">
                <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
              </div>
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Expand className="w-6 h-6 text-white" />
              </div>

              {/* Caption */}
              {photo.caption && (
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                  <p className="text-xs text-white truncate">{photo.caption}</p>
                </div>
              )}
            </button>
          ))}

          {photos.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
              <Camera className="w-10 h-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No photos uploaded</p>
            </div>
          )}
        </div>
      )}

      {/* Videos List */}
      {activeTab === "videos" && (
        <div className="space-y-2">
          {videos.map((video) => (
            <div
              key={video.id}
              className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30 border border-border/50 hover:border-border transition-all"
            >
              <div className="w-24 h-16 rounded bg-secondary flex items-center justify-center shrink-0">
                <Video className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{video.fileName}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span>{(video.fileSize / 1024 / 1024).toFixed(1)} MB</span>
                  <span>•</span>
                  <span>{new Date(video.uploadedAt).toLocaleDateString()}</span>
                </div>
              </div>
              <Button variant="ghost" size="icon-sm">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          ))}

          {videos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Video className="w-10 h-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No videos uploaded</p>
            </div>
          )}
        </div>
      )}

      {/* Documents List */}
      {activeTab === "documents" && (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30 border border-border/50 hover:border-border transition-all"
            >
              <div className="w-12 h-12 rounded bg-secondary flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{doc.fileName}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <Badge variant="outline" className="text-xs">
                    {doc.documentType}
                  </Badge>
                  <span>{(doc.fileSize / 1024).toFixed(0)} KB</span>
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {doc.uploadedBy}
                  </span>
                </div>
                {doc.description && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {doc.description}
                  </p>
                )}
              </div>
              <Button variant="ghost" size="icon-sm">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          ))}

          {documents.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="w-10 h-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No documents uploaded</p>
            </div>
          )}
        </div>
      )}

      {/* Image Lightbox */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedImage?.caption || selectedImage?.fileName}</DialogTitle>
          </DialogHeader>
          <div className="relative aspect-video bg-secondary rounded-lg flex items-center justify-center">
            <ImageIcon className="w-16 h-16 text-muted-foreground/50" />
          </div>
          {selectedImage && (
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(selectedImage.uploadedAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {selectedImage.uploadedBy}
              </span>
              {selectedImage.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  GPS captured
                </span>
              )}
              {selectedImage.tags && selectedImage.tags.length > 0 && (
                <div className="flex items-center gap-1">
                  {selectedImage.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
