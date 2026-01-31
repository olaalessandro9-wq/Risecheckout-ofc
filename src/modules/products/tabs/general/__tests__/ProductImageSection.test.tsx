/**
 * ProductImageSection Component - Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProductImageSection } from '../ProductImageSection';
import type { ImageFormState } from '../../../types/formData.types';

// Mock ImageSelector
vi.mock('@/components/products/ImageSelector', () => ({
  ImageSelector: vi.fn(({ imageUrl, imageFile, pendingRemoval }) => (
    <div data-testid="image-selector">
      {imageUrl && <div data-testid="image-url">{imageUrl}</div>}
      {imageFile && <div data-testid="image-file">{imageFile.name}</div>}
      {pendingRemoval && <div data-testid="pending-removal">Pending Removal</div>}
    </div>
  )),
}));

// Helper to create valid ImageFormState
function createMockImageState(overrides: Partial<ImageFormState> = {}): ImageFormState {
  return {
    imageFile: null,
    imageUrl: '',
    pendingRemoval: false,
    ...overrides,
  };
}

describe('ProductImageSection', () => {
  const mockOnImageFileChange = vi.fn();
  const mockOnImageUrlChange = vi.fn();
  const mockOnRemoveImage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render section title', () => {
      render(
        <ProductImageSection
          currentImageUrl={null}
          image={createMockImageState()}
          onImageFileChange={mockOnImageFileChange}
          onImageUrlChange={mockOnImageUrlChange}
          onRemoveImage={mockOnRemoveImage}
        />
      );

      expect(screen.getByText('Imagem do Produto')).toBeInTheDocument();
    });

    it('should render ImageSelector component', () => {
      render(
        <ProductImageSection
          currentImageUrl={null}
          image={createMockImageState()}
          onImageFileChange={mockOnImageFileChange}
          onImageUrlChange={mockOnImageUrlChange}
          onRemoveImage={mockOnRemoveImage}
        />
      );

      expect(screen.getByTestId('image-selector')).toBeInTheDocument();
    });
  });

  describe('ImageSelector Integration', () => {
    it('should pass currentImageUrl to ImageSelector', () => {
      const imageUrl = 'https://example.com/image.jpg';

      render(
        <ProductImageSection
          currentImageUrl={imageUrl}
          image={createMockImageState()}
          onImageFileChange={mockOnImageFileChange}
          onImageUrlChange={mockOnImageUrlChange}
          onRemoveImage={mockOnRemoveImage}
        />
      );

      expect(screen.getByTestId('image-url')).toHaveTextContent(imageUrl);
    });

    it('should pass imageFile to ImageSelector', () => {
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });

      render(
        <ProductImageSection
          currentImageUrl={null}
          image={createMockImageState({ imageFile: mockFile })}
          onImageFileChange={mockOnImageFileChange}
          onImageUrlChange={mockOnImageUrlChange}
          onRemoveImage={mockOnRemoveImage}
        />
      );

      expect(screen.getByTestId('image-file')).toHaveTextContent('test.jpg');
    });

    it('should pass pendingRemoval to ImageSelector', () => {
      render(
        <ProductImageSection
          currentImageUrl={null}
          image={createMockImageState({ pendingRemoval: true })}
          onImageFileChange={mockOnImageFileChange}
          onImageUrlChange={mockOnImageUrlChange}
          onRemoveImage={mockOnRemoveImage}
        />
      );

      expect(screen.getByTestId('pending-removal')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null currentImageUrl', () => {
      render(
        <ProductImageSection
          currentImageUrl={null}
          image={createMockImageState()}
          onImageFileChange={mockOnImageFileChange}
          onImageUrlChange={mockOnImageUrlChange}
          onRemoveImage={mockOnRemoveImage}
        />
      );

      expect(screen.queryByTestId('image-url')).not.toBeInTheDocument();
    });
  });
});
