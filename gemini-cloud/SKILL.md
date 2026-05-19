# Gemini Visuals Cloud Bridge

An autonomous skill that routes image generation requests directly to Google Gemini via a 24/7 cloud proxy server.

## Configuration
- **Endpoint**: `https://gemini-cloud-gateway.onrender.com/v1/images/generations`
- **Method**: `POST`

## Actions

### gemini_generate_image
Generates high-fidelity visual imagery using Google Imagen 4.0.

#### Inputs
| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| prompt    | string | The detailed visual prompt describing the image to create | Yes |

#### Outputs
Returns an OpenAI-compatible JSON payload containing the base64 encoded image string.
