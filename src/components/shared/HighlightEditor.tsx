"use client";

import { useState, useEffect } from "react";
import { 
  useGetArchivedStories, 
  useCreateHighlight, 
  useUpdateHighlight, 
  useDeleteHighlight, 
  useGetHighlightStories 
} from "@/lib/react-query/queriesAndMutations";
import { useToast } from "@/components/ui/use-toast";
import { X, Check, Trash2, Loader2, Play } from "lucide-react";
import { motion } from "framer-motion";
import { IStory } from "@/types";

interface HighlightEditorProps {
  highlightId?: string;
  onClose: () => void;
  onSaved?: () => void;
}

const HighlightEditor = ({ highlightId, onClose, onSaved }: HighlightEditorProps) => {
  const [title, setTitle] = useState("");
  const [selectedStoryIds, setSelectedStoryIds] = useState<string[]>([]);
  const { toast } = useToast();

  const { data: archivedStories, isPending: isLoadingArchived } = useGetArchivedStories();
  const { data: highlightStories, isPending: isLoadingHighlightStories } = useGetHighlightStories(highlightId || "");
  
  const createHighlightMutation = useCreateHighlight();
  const updateHighlightMutation = useUpdateHighlight();
  const deleteHighlightMutation = useDeleteHighlight();

  useEffect(() => {
    if (highlightId && highlightStories) {
      setSelectedStoryIds(highlightStories.map((s: IStory) => s.id));
      // Assuming we could fetch the title, but for now we might not have it in stories.
      // In a real app we might fetch the highlight details too.
    }
  }, [highlightId, highlightStories]);

  const toggleStorySelection = (storyId: string) => {
    setSelectedStoryIds(prev => 
      prev.includes(storyId) 
        ? prev.filter(id => id !== storyId)
        : [...prev, storyId]
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    if (title.length > 50) {
      toast({ title: "Title must be 50 characters or less", variant: "destructive" });
      return;
    }
    if (selectedStoryIds.length === 0) {
      toast({ title: "Select at least one story", variant: "destructive" });
      return;
    }

    try {
      if (highlightId) {
        await updateHighlightMutation.mutateAsync({ 
          highlightId, 
          updates: { title, storyIds: selectedStoryIds } 
        });
        toast({ title: "Highlight updated successfully" });
      } else {
        await createHighlightMutation.mutateAsync({ 
          title, 
          storyIds: selectedStoryIds 
        });
        toast({ title: "Highlight created successfully" });
      }
      onSaved?.();
      onClose();
    } catch (error) {
      toast({ title: "Error saving highlight", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!highlightId) return;
    try {
      await deleteHighlightMutation.mutateAsync(highlightId);
      toast({ title: "Highlight deleted successfully" });
      onSaved?.();
      onClose();
    } catch (error) {
      toast({ title: "Error deleting highlight", variant: "destructive" });
    }
  };

  const isSaving = createHighlightMutation.isPending || updateHighlightMutation.isPending;
  const isDeleting = deleteHighlightMutation.isPending;
  const isLoading = isLoadingArchived || (highlightId ? isLoadingHighlightStories : false);

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-dark-2 rounded-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden border border-dark-4"
      >
        <div className="flex items-center justify-between p-4 border-b border-dark-4">
          <h2 className="text-lg font-semibold text-light-1">
            {highlightId ? "Edit Highlight" : "New Highlight"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-dark-4 rounded-full transition">
            <X className="w-6 h-6 text-light-1" />
          </button>
        </div>

        <div className="p-4 border-b border-dark-4">
          <input
            type="text"
            placeholder="Highlight Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={50}
            className="w-full bg-dark-3 text-light-1 px-4 py-2 rounded-lg border-none focus:ring-1 focus:ring-primary-500 outline-none"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <h3 className="text-sm font-medium text-light-2 mb-4">Select Stories:</h3>
          
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
          ) : !archivedStories?.length ? (
            <p className="text-light-3 text-center py-8">
              No archived stories yet. Stories are archived after 24 hours.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {archivedStories.map((story: IStory) => {
                const isSelected = selectedStoryIds.includes(story.id);
                return (
                  <div
                    key={story.id}
                    onClick={() => toggleStorySelection(story.id)}
                    className="relative aspect-[9/16] cursor-pointer group rounded-lg overflow-hidden border border-dark-4"
                  >
                    <img 
                      src={story.media_url} 
                      alt="Story thumbnail" 
                      className="w-full h-full object-cover"
                    />
                    {story.media_type === 'video' && (
                      <div className="absolute top-2 right-2 bg-black/50 rounded-full p-1">
                        <Play className="w-3 h-3 text-white fill-white" />
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary-500/30 flex items-center justify-center">
                        <div className="bg-primary-500 rounded-full p-1">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-dark-4 flex items-center justify-between bg-dark-2">
          {highlightId ? (
            <button
              onClick={handleDelete}
              disabled={isDeleting || isSaving}
              className="flex items-center gap-2 px-4 py-2 text-red hover:bg-red/10 rounded-lg transition disabled:opacity-50"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete
            </button>
          ) : (
            <div /> // placeholder for flex-between
          )}
          
          <button
            onClick={handleSave}
            disabled={isSaving || isDeleting}
            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg transition disabled:opacity-50"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default HighlightEditor;
