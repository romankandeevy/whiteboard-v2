import { Excalidraw, MainMenu, WelcomeScreen, FONT_FAMILY } from '@excalidraw/excalidraw'

export default function Board() {
  return (
    <Excalidraw
      initialData={{
        appState: {
          currentItemFontFamily: FONT_FAMILY.Helvetica,
          currentItemRoughness: 0,
          currentItemFillStyle: 'solid',
        },
      }}
    >
      <WelcomeScreen>
        <WelcomeScreen.Center>
          <WelcomeScreen.Center.Logo>
            <span className="board-logo">Board</span>
          </WelcomeScreen.Center.Logo>
          <WelcomeScreen.Center.Heading>A blank canvas for your ideas</WelcomeScreen.Center.Heading>
          <WelcomeScreen.Center.Menu>
            <WelcomeScreen.Center.MenuItemLoadScene />
          </WelcomeScreen.Center.Menu>
        </WelcomeScreen.Center>
      </WelcomeScreen>
      <MainMenu>
        <MainMenu.DefaultItems.LoadScene />
        <MainMenu.DefaultItems.SaveToActiveFile />
        <MainMenu.DefaultItems.Export />
        <MainMenu.DefaultItems.SaveAsImage />
        <MainMenu.DefaultItems.CommandPalette />
        <MainMenu.DefaultItems.SearchMenu />
        <MainMenu.DefaultItems.ChangeCanvasBackground />
        <MainMenu.DefaultItems.ToggleTheme />
        <MainMenu.DefaultItems.ClearCanvas />
      </MainMenu>
    </Excalidraw>
  )
}
