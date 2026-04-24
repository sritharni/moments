import { AxiosError } from 'axios';
import { useRef, useState } from 'react';
import type { DragEvent, FormEvent } from 'react';
import { uploadImage } from '@/features/posts/api/upload-image';
import { createPost } from '@/features/posts/api/create-post';
import type { Post } from '@/types/post';

type CreatePostFormProps = {
  onPostCreated: (post: Post) => void;
};

const ACCEPTED_TYPES = ['image/jpeg', 'image/png'];

export function CreatePostForm({ onPostCreated }: CreatePostFormProps) {
  const [content, setContent] = useState('');
  const [contentError, setContentError] = useState('');
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function applyFile(file: File) {
    setFileError('');

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFileError('Only JPG and PNG images are allowed.');
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function removeImage() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) applyFile(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setContentError('');
    setServerError('');

    if (!content.trim()) {
      setContentError('Post text is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl: string | undefined;

      if (selectedFile) {
        imageUrl = await uploadImage(selectedFile);
      }

      const post = await createPost({ content: content.trim(), imageUrl });
      onPostCreated(post);

      setContent('');
      removeImage();
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? (error.response?.data?.message ?? 'Failed to create post.')
          : 'Failed to create post.';

      setServerError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="composer-card">
      <div className="section-heading">
        <p className="eyebrow">Create post</p>
        <h2>Share something with your feed</h2>
      </div>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="form-field">
          <label htmlFor="post-content">Post text</label>
          <textarea
            id="post-content"
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
          />
          {contentError ? <span className="field-error">{contentError}</span> : null}
        </div>

        <div className="form-field">
          <label>Image (optional)</label>

          {previewUrl ? (
            <div className="image-preview">
              <img src={previewUrl} alt="Preview" className="image-preview__img" />
              <button
                type="button"
                className="image-preview__remove"
                onClick={removeImage}
                aria-label="Remove image"
              >
                ✕
              </button>
            </div>
          ) : (
            <div
              className={`image-dropzone${isDragOver ? ' image-dropzone--active' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
              aria-label="Upload image"
            >
              <span className="image-dropzone__icon">🖼</span>
              <p className="image-dropzone__label">
                Drag &amp; drop an image, or <span className="image-dropzone__link">browse</span>
              </p>
              <p className="image-dropzone__hint">JPG or PNG</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="image-input--hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) applyFile(file);
            }}
          />

          {fileError ? <span className="field-error">{fileError}</span> : null}
        </div>

        {serverError ? (
          <div className="status-banner status-banner--error">{serverError}</div>
        ) : null}

        <div className="form-actions">
          <button className="submit-button" type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? selectedFile
                ? 'Uploading...'
                : 'Posting...'
              : 'Create post'}
          </button>
        </div>
      </form>
    </section>
  );
}
