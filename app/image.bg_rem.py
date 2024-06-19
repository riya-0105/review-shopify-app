import asyncio
import websockets
from rembg import remove 
from PIL import Image 
import io

async def process_image(websocket, path):
    async for message in websocket:
        try:
            # Process the image using rembg
            input_image = Image.open(io.BytesIO(message))
            output_image = remove(input_image)
            
            # Save the processed image to a buffer
            output_buffer = io.BytesIO()
            output_image.save(output_buffer, format='PNG')
            output_buffer.seek(0)

            # Send the processed image data back to the client
            await websocket.send(output_buffer.getvalue())
        except Exception as e:
            await websocket.send(str(e))

start_server = websockets.serve(process_image, "localhost", 8765)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
