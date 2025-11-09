### Installation steps

#### Step:1 clone the github repository
```bash
git clone https://github.com/NandishDPatel/figma-design-to-code.git
cd figma-design-to-code
```

#### Step:2 Install the python and node packages
```bash
pip install -r requirements.txt
npm i
```

#### Step:3 To see the working streamlit the live demo file
```bash
streamlit run app.py
```
- Open the streamlit app and follow the instructions

### Limitations:
- The only major limitation of the project is that it is giving html code line by line instead of nested div loops. Although the layout will come correct for the given file. As there was no mention of proper HTML code format should be produced in instructions I have submitted this code. I tried for 5-6 hours just to fix this issue but absolute positioning was becoming a problem and there wasn't anything inside api JSON response that I could find to give the proper structure using nested loops. 
- Maybe it might fail to perfom well in different design

### Future scope:
- Testing to different kinds of figma prototypes