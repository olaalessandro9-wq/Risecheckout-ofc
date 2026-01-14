/**
 * LegacyComponentEditor - Dispatcher para Editores de Componentes
 * 
 * Refatorado seguindo RISE ARCHITECT PROTOCOL:
 * - De 504 linhas para ~80 linhas (-84%)
 * - Cada editor em arquivo separado
 * - Utils e tipos extraídos
 * - Single Responsibility aplicado
 */

import React from "react";
import type { LegacyEditorProps } from "./types";
import type { 
  TextContent, 
  ImageContent, 
  AdvantageContent, 
  SealContent, 
  TimerContent, 
  TestimonialContent, 
  VideoContent 
} from "./types";
import { createChangeHandler, createImageUploadHandler } from "./utils";
import {
  TextEditor,
  ImageEditor,
  AdvantageEditor,
  SealEditor,
  TimerEditor,
  TestimonialEditor,
  VideoEditor,
  FallbackEditor,
} from "./editors";

export const LegacyComponentEditor: React.FC<LegacyEditorProps> = ({
  component,
  onUpdate,
}) => {
  const handleChange = createChangeHandler(component, onUpdate);
  const handleImageUpload = createImageUploadHandler(component, onUpdate);

  switch (component.type) {
    case "text":
      return (
        <TextEditor 
          content={component.content as TextContent | undefined} 
          handleChange={handleChange} 
        />
      );

    case "image":
      return (
        <ImageEditor 
          content={component.content as ImageContent | undefined} 
          handleChange={handleChange} 
          handleImageUpload={handleImageUpload}
        />
      );

    case "advantage":
      return (
        <AdvantageEditor 
          content={component.content as AdvantageContent | undefined} 
          handleChange={handleChange} 
        />
      );

    case "seal":
      return (
        <SealEditor 
          content={component.content as SealContent | undefined} 
          handleChange={handleChange} 
        />
      );

    case "timer":
      return (
        <TimerEditor 
          content={component.content as TimerContent | undefined} 
          handleChange={handleChange} 
        />
      );

    case "testimonial":
      return (
        <TestimonialEditor 
          content={component.content as TestimonialContent | undefined} 
          handleChange={handleChange} 
        />
      );

    case "video":
      return (
        <VideoEditor 
          content={component.content as VideoContent | undefined} 
          handleChange={handleChange} 
        />
      );

    default:
      return <FallbackEditor componentType={component.type} />;
  }
};
