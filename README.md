# AR Flower World

## Introduction
This is a Web AR interactive art piece based on p5.js. Users can capture the real environment through their mobile phone camera and “plant” flowers and falling petals that correspond to the colours of the environment by touching real objects on the screen.

## How to Run

1. Open the project folder in Visual Studio Code.
2. Start the project with Go Live so that it runs on port 5500.
3. In the VS Code terminal, type:

   npx localtunnel --port 5500
 ![Step 1](readme-images/1.png)
4. Copy the generated localtunnel link into the default browser on your mobile phone.
 ![Step 2](readme-images/2.png)
5. Enter the corresponding IP access code if required.
 ![Step 3](readme-images/3.png)
6. Allow camera access on your phone.
 ![Step 4](readme-images/5.png)
7. Move the phone camera around the environment, then tap the screen to generate flowers and swipe to release petals.
 ![Preview](readme-images/6.png)
## Interaction
- **Tap**: grow flowers
- **Swipe**: release falling petals

## Technical Notes
- Built with **p5.js**
- Uses the **mobile phone camera** as a live background
- Flower and petal colours are sampled from the surrounding environment
- Designed for **mobile interaction**

## Important
This project runs correctly in its full version on desktop. During mobile testing, it may be necessary to remove the start screen code to allow the camera-based interaction to function properly.