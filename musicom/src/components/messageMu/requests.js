import { useState, useEffect } from "react";
import {
  Box,
  Stack,
  Text,
  useBreakpointValue,
  useColorMode,
} from "@chakra-ui/react";
import { collection, getDocs } from "firebase/firestore";
import { useAuth } from "hooks/auth";
import { db } from "lib/firebase";
import { DealsComponent } from "components/profile";
import { onSnapshot } from "firebase/firestore";

const Requests = () => {
  const { user } = useAuth(); // Assuming useAuth provides user information
  const { colorMode } = useColorMode();
  const isMobile = useBreakpointValue({ base: true, md: false });

  const [requestCollection, setRequestCollection] = useState([]);

  useEffect(() => {
    const fetchRequests = () => {
      if (user) {
        try {
          const requestsRef = collection(
            db,
            user.businessName ? "businesses" : "users",
            user.id,
            "requests"
          );

          const unsubscribe = onSnapshot(requestsRef, (snapshot) => {
            const requestsData = snapshot.docs.map((doc) => ({
              ...doc.data(),
              id: doc.id,
            }));

            setRequestCollection(requestsData);
          });

          // Clean up the listener when the component unmounts or when the 'user' changes
          return () => unsubscribe();
        } catch (error) {
          console.error("Error setting up snapshot listener:", error);
        }
      }
    };

    fetchRequests();
  }, [user, setRequestCollection, db]);

  return (
    <Stack direction={"row"} width={"100%"}>
      {/* Left */}
      <Box
        position={"relative"}
        height={"100%"}
        width={isMobile ? "auto" : requestCollection ? "100%" : "30%"}
        backgroundColor={colorMode === "light" ? "#fff" : "blackAlpha.300"}
        boxShadow={"sm"}
        zIndex={2}
      >
        <DealsComponent receivedDeals={requestCollection} />
      </Box>
    </Stack>
  );
};

export default Requests;
