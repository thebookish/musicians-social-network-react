import React, { useState } from "react";
import {
  Box,
  Divider,
  IconButton,
  Stack,
  Text,
  useBreakpointValue,
  useColorMode,
} from "@chakra-ui/react";
import logoM from "Musicom Resources/Blue Logo Design/No Background/0.75x/Blue-White Icon Logo copy@0.75x.png";
import { Nav_Buttons } from "./buttons";
import { BsGearFill } from "react-icons/bs";

const Sidebar = ({
  settings,
  showSettings,
  groups,
  showGroups,
  calls,
  showCalls,
  setUserPressed,
  requests,
  showRequests,
}) => {
  const [selected, setSelected] = useState(0);

  const isMobile = useBreakpointValue({ base: true, md: false });

  const { colorMode } = useColorMode();
  return (
    <Box
      boxShadow={"xl"}
      height={isMobile ? "70vh" : "85vh"}
      width={isMobile ? 55 : 55}
      p={2}
    >
      <Stack
        direction={"column"}
        alignItems={"center"}
        justifyContent={"space-between"}
        sx={{ width: "100%", height: "100%" }}
      >
        <Stack alignItems={"center"} spacing={4}>
          <Stack
            sx={{ width: "max-content" }}
            direction={"column"}
            alignItems={"center"}
            spacing={3}
          >
            {Nav_Buttons.map((el) =>
              el.index === selected ? (
                <IconButton
                  width={"max-content"}
                  color={colorMode === "light" ? "#fff" : "#fff"}
                  bg={"blue"}
                  size={isMobile ? "md" : "md"}
                  key={el.index}
                  icon={el.icon}
                />
              ) : (
                <IconButton
                  width={"max-content"}
                  color={colorMode === "light" ? "#000" : "#fff"}
                  bg={"transparent"}
                  key={el.index}
                  size={isMobile ? "md" : "md"}
                  icon={el.icon}
                  onClick={() => setSelected(el.index)}
                />
              )
            )}
            <Divider />
            {selected === 3 ? (
              <>
                {showSettings(true)}
                {showGroups(false)}
                {showCalls(false)}
                {showRequests(false)}
                {setUserPressed("")}
                <Box p={1} sx={{ borderRadius: "xl" }}></Box>
              </>
            ) : selected === 1 ? (
              <>
                {showGroups(true)}
                {showCalls(false)}
                {showSettings(false)}
                {showRequests(false)}
                {setUserPressed("")}
              </>
            ) : selected === 2 ? (
              <>
                {showGroups(false)}
                {showCalls(false)}
                {showSettings(false)}
                {showRequests(true)}
                {setUserPressed("")}
              </>
            ) : (
              <>
                {showSettings(false)}
                {showGroups(false)}
                {showCalls(false)}
                {showRequests(false)}
              </>
            )}
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
};

export default Sidebar;
