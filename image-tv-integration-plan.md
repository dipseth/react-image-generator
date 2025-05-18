# Implementation Plan: Post Generated Image to Local TV Server via Home Assistant Automation

## 1. Requirements Recap

- Allow users to send a generated image (or web URL) from the app to a local TV server endpoint (e.g., `http://10.0.0.77:7979/notify`).
- Use the Home Assistant YAML automation payload format.
- Support customization of fields (duration, title, message, colors, etc.).
- Integrate with Home Assistant automations for smart home workflows.

---

## 2. Proposed Architecture

```mermaid
flowchart TD
    UI[React UI: Image Gallery/Generator]
    API[New TV Notification Service (frontend utility or backend endpoint)]
    TV[Local TV Server (pipup)]
    HA[Home Assistant Automation]

    UI -- "Send to TV" action --> API
    API -- POST JSON payload --> TV
    TV -- Notification --> Displayed on TV
    TV -- (optional) triggers --> HA
```

---

## 3. Implementation Steps

### A. Frontend Changes

1. **Add “Send to TV” Button**
   - In the image gallery or after image generation, add a button (e.g., “Send to TV”).
   - On click, open a modal/form to customize notification fields (duration, title, message, etc.).

2. **Create TV Notification Utility**
   - Implement a utility function (e.g., `sendImageToTV`) that:
     - Accepts image URL and user-specified fields.
     - Constructs the JSON payload as per the YAML example.
     - Sends a POST request to the TV server endpoint.

3. **Configuration**
   - Add TV server endpoint and defaults to app config (e.g., `.env` or `src/config/index.ts`).
   - Allow user override in the UI if needed.

4. **Error Handling & Feedback**
   - Show success/error notifications in the UI after attempting to send.

### B. Backend (Optional)
- If CORS or security is an issue, implement a lightweight backend proxy endpoint to forward the POST request to the TV server.

### C. Testing
- Test with real Home Assistant and TV server setup.
- Validate payload structure and field mapping.

---

## 4. Example Utility Function (Frontend)

```typescript
async function sendImageToTV({
  imageUrl,
  title = '',
  message = '',
  duration = 20,
  position = 0,
  titleColor = '#50BFF2',
  titleSize = 10,
  messageColor = '#fbf5f5',
  messageSize = 14,
  backgroundColor = '#0f0e0e',
  width = 640,
  endpoint = 'http://10.0.0.77:7979/notify'
}) {
  const payload = {
    duration,
    position,
    title,
    titleColor,
    titleSize,
    message,
    messageColor,
    messageSize,
    backgroundColor,
    media: {
      image: {
        uri: imageUrl,
        width
      }
    }
  };
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to send image to TV');
}
```

---

## 5. Config Example

Add to `src/config/index.ts`:
```typescript
export const tvNotificationConfig = {
  endpoint: import.meta.env.VITE_TV_NOTIFY_ENDPOINT || 'http://10.0.0.77:7979/notify',
  defaultWidth: 640,
  // ...other defaults
};
```

---

## 6. Example YAML Automations

**pipup_image_on_tv:**
```yaml
pipup_image_on_tv:
  url: http://10.0.0.77:7979/notify
  content_type: "application/json"
  verify_ssl: false
  method: "post"
  timeout: 20
  payload: >
    {
      "duration": {{ duration | default(20) }},
      "position": {{ position | default(0) }},
      "title": "{{ title | default('') }}",
      "titleColor": "{{ titleColor | default('#50BFF2') }}",
      "titleSize": {{ titleSize | default(10) }},
      "message": "{{ message }}",
      "messageColor": "{{ messageColor | default('#fbf5f5') }}",
      "messageSize": {{ messageSize | default(14) }},
      "backgroundColor": "{{ backgroundColor | default('#0f0e0e') }}",
      "media": { 
        "image": {
          "uri": "{{ url }}",
          "width": {{ width | default(640) }}
        }
      }
    }
```

**pipup_url_on_tv:**
```yaml
pipup_url_on_tv:
  url: http://10.0.0.77:7979/notify
  content_type: "application/json"
  verify_ssl: false
  method: "post"
  timeout: 20
  payload: >
    {
      "duration": {{ duration | default(20) }},
      "position": {{ position | default(0) }},
      "title": "{{ title | default('') }}",
      "titleColor": "{{ titleColor | default('#50BFF2') }}",
      "titleSize": {{ titleSize | default(10) }},
      "message": "{{ message }}",
      "messageColor": "{{ messageColor | default('#fbf5f5') }}",
      "messageSize": {{ messageSize | default(14) }},
      "backgroundColor": "{{ backgroundColor | default('#0f0e0e') }}",
      "media": { 
        "web": {
          "uri": "{{ url }}", 
          "width": {{ width | default(640) }},
          "height": {{ height | default(480) }}
        }
      }
    }
```

---

## 7. Open Questions / Clarifications

- Should the user be able to send both images and web URLs, or just images?
- Is authentication required for the TV server endpoint?
- Should the notification action be available for all images or only the most recent?