# Codebase Memory Map

## Core Architecture Overview

### Key Components
- **Frontend Framework**: React 19.1.0 with TypeScript
- **State Management**: Zustand 5.0.4
- **API Integration**: @tanstack/react-query 5.76.1
- **UI Framework**: Mantine 8.0.1
- **Development Tools**: Vite 6.3.5, TypeScript 5.8.3

### Architectural Principles
1. **Modular Design**: Independent, replaceable components
2. **Separation of Concerns**: Clear UI/state/API boundaries
3. **Pluggable Services**: Support for multiple AI providers
4. **Progressive Enhancement**: Core functionality with optional features

## Key File Locations and Purposes

### Core Application Files
```
src/
├── App.tsx                 # Main application component
├── main.tsx               # Application entry point
└── vite-env.d.ts         # TypeScript environment declarations
```

### Component Structure
```
src/components/
├── ImageGenerator/        # Main image generation interface
├── ImageGallery/         # Display and management of generated images
├── DownloadIcon/         # Reusable image download component
└── common/               # Shared UI components
```

### State and Services
```
src/
├── store/
│   ├── slices/           # Modular state management
│   │   ├── imageSlice.ts # Image-related state
│   │   └── uiSlice.ts    # UI-related state
│   └── index.ts          # Store composition
├── services/
│   └── imageGeneration/  # Image generation service implementations
├── utils/
│   ├── imageDownload.ts  # Image download utility functions
│   └── tvIntegration.ts  # TV integration utilities
└── hooks/
    └── queries/          # React Query hooks for data fetching
```

## Common Update Patterns

### Adding New Features
1. Create new component in `src/components/`
2. Add state slice if needed in `store/slices/`
3. Create necessary API hooks in `hooks/queries/`
4. Update main components to integrate new feature

### Modifying Image Generation
1. Update `src/services/imageGeneration/` for provider changes
2. Modify `src/hooks/queries/useGenerateImage.ts` for new parameters
3. Update ImageGenerator component UI
4. Adjust state management in image slice if needed

### UI Updates
1. Modify component in `src/components/`
2. Update Mantine theme configurations if needed
3. Adjust responsive layouts using Mantine hooks
4. Update related UI state in uiSlice.ts

### Managing Downloads
1. Import required utilities from `src/utils/imageDownload.ts`
2. Use DownloadIcon component with proper props:
   - imageUrl: Source URL of the image
   - prompt: Used for generating filename
   - position: Positioning of the download button
3. Handle download states and error feedback
4. Consider UX for different image states (loading, error)

## Critical Dependencies

### Core Dependencies
- **@mantine/core**: UI component library
- **@tanstack/react-query**: API state management
- **zustand**: Application state management
- **openai**: OpenAI API integration

### Development Dependencies
- **TypeScript**: Type safety and developer experience
- **Vite**: Build tool and development server
- **ESLint**: Code quality and consistency

### Integration Points
1. **OpenAI Service**:
   - Configuration: `src/config/`
   - Implementation: `src/services/imageGeneration/openai.ts`
   - Types: `src/types/api.ts`

2. **State Management**:
   - Store Configuration: `src/store/index.ts`
   - Image State: `src/store/slices/imageSlice.ts`
   - UI State: `src/store/slices/uiSlice.ts`

3. **UI Components**:
   - Mantine Integration: `src/components/ui/`
   - Theme Configuration: `src/styles/theme.ts`
   - Download Integration: `src/components/DownloadIcon/`

4. **Image Download**:
   - Utility Functions: `src/utils/imageDownload.ts`
   - Component Integration: `src/components/DownloadIcon/index.tsx`
   - Gallery Integration: Multiple download points in ImageGallery

## Performance Considerations
- Implement proper React Query caching strategies
- Use Zustand selectors with shallow equality checks
- Lazy load components and routes
- Optimize image loading and caching

## Security Notes
- API keys managed through environment variables
- Input validation required for image generation
- Rate limiting implemented in proxy server
- Secure handling of generated images

This document should be updated when making significant architectural changes or adding new critical dependencies.