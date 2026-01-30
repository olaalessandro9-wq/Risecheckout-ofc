/**
 * ProductImageSection Component - Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for ProductImageSection component including rendering and
 * integration with ImageSelector.
 * 
 * @module products/tabs/general/__tests__/ProductImageSection.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProductImageSection } from '../ProductImageSection';

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

describe('ProductImageSection', () => {
  const mockImage = {
    imageFile: null,
    imagePreview: null,
    pendingRemoval: false,
  };

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
          image={mockImage}
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
          image={mockImage}
          onImageFileChange={mockOnImageFileChange}
          onImageUrlChange={mockOnImageUrlChange}
          onRemoveImage={mockOnRemoveImage}
        />
      );

      expect(screen.getByTestId('image-selector')).toBeInTheDocument();
    });

    it('should have proper styling classes', () => {
      const { container } = render(
        <ProductImageSection
          currentImageUrl={null}
          image={mockImage}
          onImageFileChange={mockOnImageFileChange}
          onImageUrlChange={mockOnImageUrlChange}
          onRemoveImage={mockOnRemoveImage}
        />
      );

      const section = container.firstChild as HTMLElement;
      expect(section).toHaveClass('border-t', 'border-border', 'pt-6');
    });
  });

  describe('ImageSelector Integration', () => {
    it('should pass currentImageUrl to ImageSelector', () => {
      const imageUrl = 'https://example.com/image.jpg';

      render(
        <ProductImageSection
          currentImageUrl={imageUrl}
          image={mockImage}
          onImageFileChange={mockOnImageFileChange}
          onImageUrlChange={mockOnImageUrlChange}
          onRemoveImage={mockOnRemoveImage}
        />
      );

      expect(screen.getByTestId('image-url')).toHaveTextContent(imageUrl);
    });

    it('should pass imageFile to ImageSelector', () => {
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const imageWithFile = {
        ...mockImage,
        imageFile: mockFile,
      };

      render(
        <ProductImageSection
          currentImageUrl={null}
          image={imageWithFile}
          onImageFileChange={mockOnImageFileChange}
          onImageUrlChange={mockOnImageUrlChange}
          onRemoveImage={mockOnRemoveImage}
        />
      );

      expect(screen.getByTestId('image-file')).toHaveTextContent('test.jpg');
    });

    it('should pass pendingRemoval to ImageSelector', () => {
      const imageWithPendingRemoval = {
        ...mockImage,
        pendingRemoval: true,
      };

      render(
        <ProductImageSection
          currentImageUrl={null}
          image={imageWithPendingRemoval}
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
          image={mockImage}
          onImageFileChange={mockOnImageFileChange}
          onImageUrlChange={mockOnImageUrlChange}
          onRemoveImage={mockOnRemoveImage}
        />
      );

      expect(screen.queryByTestId('image-url')).not.toBeInTheDocument();
    });

    it('should handle undefined currentImageUrl', () => {
      render(
        <ProductImageSection
          currentImageUrl={undefined}
          image={mockImage}
          onImageFileChange={mockOnImageFileChange}
          onImageUrlChange={mockOnImageUrlChange}
          onRemoveImage={mockOnRemoveImage}
        />
      );

      expect(screen.queryByTestId('image-url')).not.toBeInTheDocument();
    });

    it('should handle empty image state', () => {
      render(
        <ProductImageSection
          currentImageUrl={null}
          image={mockImage}
          onImageFileChange={mockOnImageFileChange}
          onImageUrlChange={mockOnImageUrlChange}
          onRemoveImage={mockOnRemoveImage}
        />
      );

      expect(screen.queryByTestId('image-file')).not.toBeInTheDocument();
      expect(screen.queryByTestId('pending-removal')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have semantic HTML structure', () => {
      const { container } = render(
        <ProductImageSection
          currentImageUrl={null}
          image={mockImage}
          onImageFileChange={mockOnImageFileChange}
          onImageUrlChange={mockOnImageUrlChange}
          onRemoveImage={mockOnRemoveImage}
        />
      );

      const heading = container.querySelector('h3');
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Imagem do Produto');
    });
  });

  describe('Component Props', () => {
    it('should accept all required props', () => {
      expect(() => {
        render(
          <ProductImageSection
            currentImageUrl="https://example.com/image.jpg"
            image={mockImage}
            onImageFileChange={mockOnImageFileChange}
            onImageUrlChange={mockOnImageUrlChange}
            onRemoveImage={mockOnRemoveImage}
          />
        );
      }).not.toThrow();
    });

    it('should work with all image states', () => {
      const imageStates = [
        { imageFile: null, imagePreview: null, pendingRemoval: false },
        { imageFile: new File([''], 'test.jpg'), imagePreview: 'blob:test', pendingRemoval: false },
        { imageFile: null, imagePreview: null, pendingRemoval: true },
      ];

      imageStates.forEach((imageState) => {
        const { unmount } = render(
          <ProductImageSection
            currentImageUrl={null}
            image={imageState}
            onImageFileChange={mockOnImageFileChange}
            onImageUrlChange={mockOnImageUrlChange}
            onRemoveImage={mockOnRemoveImage}
          />
        );

        expect(screen.getByTestId('image-selector')).toBeInTheDocument();
        unmount();
      });
    });
  });
});
