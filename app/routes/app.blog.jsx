import {
    Box,
    Card,
    Layout,
    Link,
    List,
    Page,
    Text,
    BlockStack,
    TextField,
    Image,
    Spinner,
    Form,
    Button,
    OptionList,
    ButtonGroup,
    ColorPicker
  } from "@shopify/polaris";
  import { TitleBar } from "@shopify/app-bridge-react";
  import { useState, useCallback, useEffect, useRef } from "react";
  // import { authenticate } from "../shopify.server";
  import { query } from '../image.generate';
  import { useActionData, useNavigation, useSubmit } from "@remix-run/react";
  
  export const action = async ({ request }) => {
    const formData = await request.formData();
    const imagePrompt = formData.get("imagePrompt");
    console.log("the prompt is: ", imagePrompt);
  
    const imageBytes = await query({ inputs: imagePrompt });
    return imageBytes;
  };
  
  export default function BlogPage() {

    // variables
    const [blogText, setBlobText] = useState('');
    const [selectionStart, setSelectionStart] = useState(0);
    const [selectionEnd, setSelectionEnd] = useState(0);
    const [activeButtonIndex, setActiveButtonIndex] = useState(-1);
    const optionsButtons = document.querySelectorAll(".option-button");
    const advancedOptionButton = document.querySelectorAll(".adv-option-button");
    const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#000000', '#FFFFFF'];
    const [color, setColor] = useState(colors[0]);
    const fonts = [
      "Abadi MT Condensed Light",
      "Albertus Extra Bold",
      "Albertus Medium",
      "Antique Olive",
      "Arial",
      "Arial Black",
      "Arial MT",
      "Arial Narrow",
      "Bazooka",
      "Book Antiqua",
      "Bookman Old Style",
      "Boulder",
      "Calisto MT",
      "Calligrapher",
      "Century Gothic",
      "Century Schoolbook",
      "Cezanne",
      "CG Omega",
      "CG Times",
      "Charlesworth",
      "Chaucer",
      "Clarendon Condensed",
      "Comic Sans MS",
      "Copperplate Gothic Bold",
      "Copperplate Gothic Light",
      "Cornerstone",
      "Coronet",
      "Courier",
      "Courier New",
      "Cuckoo",
      "Dauphin",
      "Denmark",
      "Fransiscan",
      "Garamond",
      "Geneva",
      "Haettenschweiler",
      "Heather",
      "Helvetica",
      "Herald",
      "Impact",
      "Jester",
      "Letter Gothic",
      "Lithograph",
      "Lithograph Light",
      "Long Island",
      "Lucida Console",
      "Lucida Handwriting",
      "Lucida Sans",
      "Lucida Sans Unicode",
      "Marigold",
      "Market",
      "Matisse ITC",
      "MS LineDraw",
      "News GothicMT",
      "OCR A Extended",
      "Old Century",
      "Pegasus",
      "Pickwick",
      "Poster",
      "Pythagoras",
      "Sceptre",
      "Sherwood",
      "Signboard",
      "Socket",
      "Steamer",
      "Storybook",
      "Subway",
      "Tahoma",
      "Technical",
      "Teletype",
      "Tempus Sans ITC",
      "Times",
      "Times New Roman",
      "Times New Roman PS",
      "Trebuchet MS",
      "Tristan",
      "Tubular",
      "Unicorn",
      "Univers",
      "Univers Condensed",
      "Vagabond",
      "Verdana",
      "Westminster",
      "Allegro",
      "Amazone BT",
      "AmerType Md BT",
      "Arrus BT",
      "Aurora Cn BT",
      "AvantGarde Bk BT",
      "AvantGarde Md BT",
      "BankGothic Md BT",
      "Benguiat Bk BT",
      "BernhardFashion BT",
      "BernhardMod BT",
      "BinnerD",
      "Bremen Bd BT",
      "CaslonOpnface BT",
      "Charter Bd BT",
      "Charter BT",
      "ChelthmITC Bk BT",
      "CloisterBlack BT",
      "CopperplGoth Bd BT",
      "English 111 Vivace BT",
      "EngraversGothic BT",
      "Exotc350 Bd BT",
      "Freefrm721 Blk BT",
      "FrnkGothITC Bk BT",
      "Futura Bk BT",
      "Futura Lt BT",
      "Futura Md BT",
      "Futura ZBlk BT",
      "FuturaBlack BT",
      "Galliard BT",
      "Geometr231 BT",
      "Geometr231 Hv BT",
      "Geometr231 Lt BT",
      "GeoSlab 703 Lt BT",
      "GeoSlab 703 XBd BT",
      "GoudyHandtooled BT",
      "GoudyOLSt BT",
      "Humanst521 BT",
      "Humanst 521 Cn BT",
      "Humanst521 Lt BT",
      "Incised901 Bd BT",
      "Incised901 BT",
      "Incised901 Lt BT",
      "Informal011 BT",
      "Kabel Bk BT",
      "Kabel Ult BT",
      "Kaufmann Bd BT",
      "Kaufmann BT",
      "Korinna BT",
      "Lydian BT",
      "Monotype Corsiva",
      "NewsGoth BT",
      "Onyx BT",
      "OzHandicraft BT",
      "PosterBodoni BT",
      "PTBarnum BT",
      "Ribbon131 Bd BT",
      "Serifa BT",
      "Serifa Th BT",
      "ShelleyVolante BT",
      "Souvenir Lt BT",
      "Staccato222 BT",
      "Swis721 BlkEx BT",
      "Swiss911 XCm BT",
      "TypoUpright BT",
      "ZapfEllipt BT",
      "ZapfHumnst BT",
      "ZapfHumnst Dm BT",
      "Zurich BlkEx BT",
      "Zurich Ex"
  ]

    // methods
    const handleBlobText = useCallback((value) => {
      setBlobText(value);
    }, [blogText]);

    const handleBoldClick = () => {
      console.log("selected data are: ", selectionStart, selectionEnd);
      if (selectionStart === selectionEnd) return; // No text selected
      console.log("blogText type:", typeof blogText);
      const newText =
        String(blogText).substring(0, selectionStart) +
        "<strong>" +
        String(blogText).substring(selectionStart, selectionEnd) +
        "</strong>" +
        String(blogText).substring(selectionEnd);
      setBlobText(newText); // Update the state with the new text
    };

    const handleSelectionChange = (start, end) => {
      setSelectionStart(start);
      setSelectionEnd(end);
    };

    const handleMouseDown = (event) => {
      setSelectionStart(event.target.selectionStart);
    };
  
    const handleMouseUp = (event) => {
      setSelectionEnd(event.target.selectionEnd);
    };

    const handleColorChange = (event) => {
      setColor(event.target.value);
    };

    const initializer = () => {
      for (let i = 1; i <= 7; i++) {
        let option = document.createElement("option");
        option.value = i;
        option.innerHTML = i;
        fontSizeRef.appendChild(option);
      }
      //default size
      fontSizeRef.value = 3;
    };
    //main logic
    const modifyText = (command, defaultUi, value) => {
      //execCommand executes command on selected text
      document.execCommand(command, defaultUi, value);
    };
    //For basic operations which don't need value parameter
    optionsButtons.forEach((button) => {
      button.addEventListener("click", () => {
        modifyText(button.id, false, null);
      });
    });
    //options that require value parameter (e.g colors, fonts)
    advancedOptionButton.forEach((button) => {
      button.addEventListener("change", () => {
        modifyText(button.id, false, button.value);
      });
    });
    
  
    return (
      <Page>
        <TitleBar title="Images" />
        <Layout>
          <Layout.Section>
            <Card>
            <BlockStack gap="300">
                <Text variant="headingMd" as="h6">
                  Blog Generation
                </Text>
                <ButtonGroup variant="segmented">
                  <Button
                    className="option-button"
                    // pressed={activeButtonIndex === 0}
                    // onClick={handleBoldClick()}
                  >
                    <strong>B</strong>
                  </Button>
                  <Button
                    className="option-button"
                    // pressed={activeButtonIndex === 1}
                    // onClick={() => handleButtonClick(1)}
                  >
                    <i>i</i>
                  </Button>
                  <Button
                    className="option-button"
                    // pressed={activeButtonIndex === 2}
                    // onClick={() => handleButtonClick(2)}
                  >
                    <u>U</u>
                  </Button>
                  <Button
                    className="option-button"
                    // pressed={activeButtonIndex === 2}
                    // onClick={() => handleButtonClick(2)}
                  >
                    <Image
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTK3-D8B90Kjv92QaPnUkUKKgzCtoCdWD1sUuCbuBB8gg&s"
                    width={12}
                    />
                  </Button>
                  <Button
                    // pressed={activeButtonIndex === 2}
                    // onClick={() => handleButtonClick(2)}
                  >
                    <Image
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRTKMuB7GONeTZ--8yIcUQ1cuKto29Mx6P9xICsACjnIA&s"
                    width={12}
                    />
                  </Button>
                  <Button>
                    <Image
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQO9nGmKys4-EHa_ZSAn_bJv5obA-UaBBxbAZIh-6SMVb_t5YGMByVj3RkELo8IIEqyUHk&usqp=CAU"
                    width={12}
                    />
                  </Button>
                  <Button>
                    <Image
                    src="https://cdn.icon-icons.com/icons2/2248/PNG/512/format_list_bulleted_icon_137578.png"
                    width={12}
                    />
                  </Button>
                  <Button>
                    <Image
                    src="https://cdn-icons-png.flaticon.com/512/60/60690.png"
                    width={12}
                    />
                  </Button>
                  <Button>
                    <Image
                    src="https://cdn-icons-png.freepik.com/512/44/44650.png"
                    width={12}
                    />
                  </Button>
                  <Button>
                    <s>S</s>
                  </Button>
                  <Button>
                    <Image
                    src="https://cdn-icons-png.freepik.com/256/455/455691.png?semt=ais_hybrid"
                    width={12}
                    />
                  </Button>
                  <Button>
                    <Image
                    src="https://www.svgrepo.com/show/352621/unlink.svg"
                    width={12}
                    />
                  </Button>
                </ButtonGroup>
                <ButtonGroup variant="segmented">
                  <Button>
                    <Image
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR-WtbcERqplpfD0z_wtl_0oQpKKdvCtD1_2PCPt1GXyQ&s"
                    width={12}
                    />
                  </Button>
                  <Button>
                    <Image
                    src="https://cdn-icons-png.flaticon.com/512/154/154590.png"
                    width={12}
                    />
                  </Button>
                  <Button>
                    <Image
                    src="https://w7.pngwing.com/pngs/700/71/png-transparent-text-action-right-alignment-align-sign-symbol-icon-thumbnail.png"
                    width={12}
                    />
                  </Button>
                  <Button>
                    <Image
                    src="https://cdn-icons-png.freepik.com/512/154/154588.png"
                    width={12}
                    />
                  </Button>
                  <Button>
                    <Image
                    src="https://cdn-icons-png.freepik.com/512/154/154591.png"
                    width={12}
                    />
                  </Button>
                  <Button>
                    <Image
                    src="https://cdn-icons-png.freepik.com/512/154/154592.png"
                    width={12}
                    />
                  </Button>
                  <select style={{ padding: "6px", border: "1px solid #020929", borderRadius: "3px" }} className="adv-option-button">
                    <option>
                      <h1>h1</h1>
                    </option>
                    <option>
                      <h2>h2</h2>
                    </option>
                    <option>
                      <h3>h3</h3>
                    </option>
                    <option>
                      <h4>h4</h4>
                    </option>
                    <option>
                      <h5>h5</h5>
                    </option>
                    <option>
                      <h6>h6</h6>
                    </option>
                  </select>
                  <select style={{ padding: "6px", border: "1px solid #020929", borderRadius: "3px" }} className="adv-option-button">
                    {fonts.map((fontItem, index) => (
                      <option key={index} value={fontItem}>{fontItem}</option>
                    ))}
                  </select>
                  <select className="adv-option-button" style={{ padding: "6px", border: "1px solid #020929", borderRadius: "3px" }} value={color} onChange={handleColorChange}>
                    {colors.map((color, index) => (
                      <option key={index} style={{ backgroundColor: color }} value={color}></option>
                    ))}
                  </select>
                  {/* <ColorPicker
                  color={color}
                  onChange={setColor}
                  /> */}
                </ButtonGroup>
                <Box shadow="500">
                {/* <input
                  type="text"
                  value={blogText}
                  onChange={handleBlobText}
                  // onSelect={handleSelectionChange}
                  style={{ width: '100%', height: '300px' }}
                /> */}
                <div id="text-input" contenteditable="true" style={{ marginTop: "10px", border: "1px solid #dddddd", padding: "20px", height: "50vh" }}></div>
                </Box>
              </BlockStack>
            </Card>
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="300" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                  <Text variant="headingMd" as="h6">
                      Generated Image
                  </Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }
  