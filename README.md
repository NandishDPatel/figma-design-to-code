### Installation steps

#### Step:1 clone the github repository
```bash
git clone https://github.com/NandishDPatel/figma-design-to-code.git
cd figma-design-to-code
```

#### Step:2 Setup the .env variables
- create .env file and setup two env variables 
```bash
FIGMA_ACCESS_TOKEN="your-access-token-for-figma-account-goes-here"
FIGMA_URL="your-figma-url-for-the-project-goes-here"
```
- You can get you figma access token from [https://help.figma.com/hc/en-us/articles/8085703771159-Manage-personal-access-tokens](https://help.figma.com/hc/en-us/articles/8085703771159-Manage-personal-access-tokens)
- For FIGMA_URL - you can just simply copy paste your entire url like in this case it was "https://www.figma.com/design/MxMXpjiLPbdHlratvH0Wdy/Softlight-Engineering-Take-Home-Assignment?node-id=0-1&p=f&t=cRwYCgKfS0haehGa-0"

#### Step:3 Run the project
```bash
npm i
node index.js
```

#### Step:4 To see the output file
- Go inside the /output directory and you will find index.html and styles.css

### Limitations:
- The only major limitation of the project is that it is giving html code line by line instead of nested div loops. Although the layout will come correct for the given file. As there was no mention of proper HTML code format should be produced in instructions I have submitted this code. I tried for 5-6 hours just to fix this issue but absolute positioning was becoming a problem and there wasn't anything inside api JSON response that I could find to give the proper structure using nested loops. (It took me approx 4 hours to build this except fixing of bug html code couldn't solve after 6 hours).
- Maybe it might not perform well in different types of design where some unknowns like symbols or something special is present.

### Future scope:
- UI/UX can be provided and proper html formatting code can be produced with nested divs