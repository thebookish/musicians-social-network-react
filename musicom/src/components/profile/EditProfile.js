import React, { useEffect, useState } from "react";
import {
  Button,
  FormControl,
  FormLabel,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  VStack,
  useToast,
  Input,
  InputGroup,
  InputLeftElement,
  Box,
  Badge,
  IconButton,
  Wrap,
  WrapItem,
  Text,
  Select,
  CloseButton,
  Flex,
  Icon,
  Switch,
} from "@chakra-ui/react";
import { useAuth } from "hooks/auth";
import { useUpdateAvatar, useUpdateUserSettings } from "hooks/users";
import Avatar from "./Avatar";
import { BiMap, BiMusic, BiWorld } from "react-icons/bi";
import { usePlacesWidget } from "react-google-autocomplete";
import { CloseIcon } from "@chakra-ui/icons";
import { db, firestore } from "lib/firebase";
import {
  collection,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  getDocs,
  query,
  where,
  Timestamp,
  deleteDoc,
} from "@firebase/firestore";
import axios from "axios";
import isUsernameExists from "utils/isUsernameExists";
import mbxGeocoding from "@mapbox/mapbox-sdk/services/geocoding";
import industries from "lib/industries.json";
import PhoneInput from "react-phone-input-2";
import { PROTECTED } from "lib/routes";
import genresJSON from "lib/genres.json";
import { Spinner } from "phosphor-react";

const PlacesAutocomplete = ({ setLocation, prevLocation }) => {
  const { ref } = usePlacesWidget({
    apiKey: "AIzaSyAiZbto8zmxYQnYqKo4YSq3ZknmncpxVbo",
    onPlaceSelected: (place) => {
      setLocation(place.formatted_address);
    },
  });

  return (
    <FormControl>
      <InputGroup>
        <InputLeftElement pointerEvents="none">
          <Box color="gray.300" display="flex" alignItems="center">
            <BiMap color="gray" h="6" w="6" />
          </Box>
        </InputLeftElement>
        <Input
          ref={ref}
          style={{ width: "100%" }}
          value={prevLocation}
          placeholder="Insert your location"
        />
      </InputGroup>
    </FormControl>
  );
};

const AddressAutocomplete = ({ businessLocation, setBusinessLocation }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const handlePlaceSearch = async (value) => {
    setSearchQuery(value);

    try {
      const geocodingClient = mbxGeocoding({
        accessToken:
          "pk.eyJ1IjoiYWxlbGVudGluaSIsImEiOiJjbGk5ZWF5MnQwOHl2M25wcXBjamd3NjQ4In0.MpcjArF0h_rXY6O3LdqjwA",
      });
      const response = await geocodingClient
        .forwardGeocode({
          query: value,
          limit: 5,
          language: ["en"],
          types: ["address"],
        })
        .send();

      const results = response.body.features;

      const citySuggestions = results.map((result) => ({
        address: result.place_name,
        latitude: result.center[1],
        longitude: result.center[0],
      }));

      setSuggestions(citySuggestions);
    } catch (error) {
      console.error("Error fetching location suggestions:", error);
      setSuggestions([]);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (searchQuery.trim() !== "") {
        setBusinessLocation((prevLocations) => [
          ...prevLocations,
          [searchQuery.trim()],
        ]);
        setSearchQuery("");
      }
    }
  };

  const handleSelectSuggestion = (selectedSuggestion) => {
    const { address, latitude, longitude } = selectedSuggestion;
    setBusinessLocation((prevLocations) => [
      ...prevLocations,
      { address, latitude, longitude },
    ]);
    setSearchQuery("");
    setSuggestions([]);
  };

  const handleDeleteAddress = (address) => {
    setBusinessLocation((prevLocations) =>
      prevLocations.filter((loc) => loc.address !== address)
    );
  };

  return (
    <FormControl>
      <FormLabel>Business Locations</FormLabel>
      <InputGroup>
        <InputLeftElement pointerEvents="none">
          <Box color="gray.300" display="flex" alignItems="center">
            <BiMap color="gray" h="6" w="6" />
          </Box>
        </InputLeftElement>
        <Input
          style={{ width: "100%" }}
          placeholder="Insert your location"
          value={searchQuery}
          onChange={(e) => handlePlaceSearch(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </InputGroup>
      {suggestions.length > 0 && (
        <Wrap mt={2} spacing={2}>
          {suggestions.map((suggestion, index) => (
            <WrapItem key={suggestion.address + index}>
              <Badge
                colorScheme="blue"
                cursor="pointer"
                onClick={() => handleSelectSuggestion(suggestion)}
              >
                {suggestion.address}
              </Badge>
            </WrapItem>
          ))}
        </Wrap>
      )}
      <Wrap mt={2} spacing={2}>
        {businessLocation.map((location, index) => (
          <WrapItem key={location + index}>
            <Badge colorScheme="green">
              {location.address}
              <CloseButton
                size="sm"
                onClick={() => handleDeleteAddress(location.address)}
              />
            </Badge>
          </WrapItem>
        ))}
      </Wrap>
    </FormControl>
  );
};

export default function EditProfile({ isOpen, onCloseModal }) {
  const toast = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const {
    setFile,
    updateAvatar,
    isLoading: fileLoading,
    fileURL,
  } = useUpdateAvatar(user?.id);
  const [username, setUsername] = useState(user?.username || "");
  const [instruments, setInstruments] = useState(user?.instrument || []);
  const [genres, setGenres] = useState(user?.genres || []);
  const [genre, setGenre] = useState(user?.genre || []);
  const [roles, setRoles] = useState(user?.role || "");
  const [location, setLocation] = useState(
    user?.locations || user?.location || ""
  );
  const [languages, setLanguages] = useState(
    user?.languages ? user.languages : []
  );
  const [natureOfBusiness, setNatureOfBusiness] = useState(
    user?.natureOfBusiness || ""
  );
  const [phoneNumber, setPhoneNumber] = useState(
    user?.phoneNumber ? user.phoneNumber : []
  );
  const [bio, setBio] = useState(user?.bio || "");
  const [isProfilePrivate, setIsProfilePrivate] = useState(
    user?.isProfileLocked || false
  );

  const {
    updateUserSettings,
    updateBusinessSettings,
    isLoading: settingsLoading,
  } = useUpdateUserSettings();

  const [existingInstruments, setExistingInstruments] = useState([]);
  const [existingGenres, setExistingGenres] = useState([]);
  const [languageOptions, setLanguageOptions] = useState([]);
  const [dataFetched, setDataFetched] = useState(false); // New state variable
  const fetchLanguages = async () => {
    try {
      const response = await axios.get("https://restcountries.com/v2/all");
      const countries = response.data;
      const languages = countries.reduce((allLanguages, country) => {
        const countryLanguages = country.languages.map((language) => ({
          value: language.name,
          label: language.name,
        }));
        return [...allLanguages, ...countryLanguages];
      }, []);
      return languages;
    } catch (error) {
      console.error("Error fetching language data:", error);
      return [];
    }
  };
  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        try {
          let querySnapshot, businessQuerySnapshot;
          if (user.businessName === undefined) {
            const q = query(
              collection(db, "users"),
              where("username", "==", user?.username)
            );
            querySnapshot = await getDocs(q);
            setExistingInstruments(
              querySnapshot?.docs[0]?.data()?.instrument || []
            );

            querySnapshot = await getDocs(q);
            setExistingGenres(querySnapshot?.docs[0]?.data()?.genre || []);
            setGenres(querySnapshot?.docs[0]?.data()?.genre || []);
            setInstruments(querySnapshot?.docs[0]?.data()?.instrument || []);
            setRoles(querySnapshot?.docs[0]?.data()?.role || "");
            setUsername(querySnapshot?.docs[0]?.data()?.username || "");
            setSigned(querySnapshot?.docs[0]?.data()?.signed || "false");
            setSelectedFile(querySnapshot?.docs[0]?.data()?.avatar);
            setLanguages(querySnapshot?.docs[0]?.data()?.languages || []);
            setBio(querySnapshot?.docs[0]?.data()?.bio || "");
          } else if (user.businessName !== undefined) {
            const businessQ = query(
              collection(db, "businesses"),
              where("username", "==", user?.username)
            );
            businessQuerySnapshot = await getDocs(businessQ);
            setUsername(businessQuerySnapshot?.docs[0]?.data()?.username);
            setSigned("false");
            setBio(businessQuerySnapshot?.docs[0]?.data()?.bio);
            setBusinessLocation(
              businessQuerySnapshot?.docs[0]?.data()?.locations
            );
            setPhoneNumber(businessQuerySnapshot?.docs[0]?.data()?.phoneNumber);
            setNatureOfBusiness(
              businessQuerySnapshot?.docs[0]?.data()?.natureOfBusiness
            );
            setSelectedFile(businessQuerySnapshot?.docs[0]?.data()?.avatar);
            setLanguages(
              businessQuerySnapshot?.docs[0]?.data()?.languages || []
            );
          }
        } catch (error) {
          console.log("Failed to fetch user's data", error);
        }

        setDataFetched(true); // Mark data as fetched
      };
      const fetchLanguageOptions = async () => {
        const language = await fetchLanguages();
        setLanguageOptions(language);
      };

      fetchData();
      fetchLanguageOptions();
    }
    return;
  }, [user, dataFetched]);

  useEffect(() => {
    const fetchCategories = () => {
      setBusinessCategories(industries.industryCategories);
    };

    return () => fetchCategories();
  }, []);

  useEffect(() => {
    if (!businessCategories.includes(natureOfBusiness)) {
      setShowOtherBusinessTextField(true);
    } else {
      setShowOtherBusinessTextField(false);
    }
    return;
  }, [natureOfBusiness]);

  const [file, setSelectedFile] = useState(user?.avatar || {});
  function handleChange(event) {
    if (event.target.files[0]) {
      const selectedFile = event.target.files[0];
      setSelectedFile(selectedFile);
      setFile(selectedFile);
    }
    //updateAvatar(selectedFile); // Pass the selected file to the updateAvatar function
  }

  const addInstrument = (instrument) => {
    setInstruments([...instruments, instrument]);
  };

  const deleteInstrument = (instrument) => {
    const updatedInstruments = instruments.filter(
      (item) => item !== instrument
    );
    setInstruments(updatedInstruments);
  };
  const addGenre = (genre) => {
    setGenres([...genres, genre]);
  };
  const deleteGenre = (genre) => {
    const updatedGenres = genres.filter((item) => item !== genre);
    setGenres(updatedGenres);
  };
  async function handleSaveBusiness() {
    try {
      const updatedSettings = {};
      if (username) updatedSettings.username = username;
      if (languages.length) updatedSettings.languages = languages;
      if (natureOfBusiness) updatedSettings.natureOfBusiness = natureOfBusiness;
      if (phoneNumber) updatedSettings.phoneNumber = `+${phoneNumber}`;
      if (bio) updatedSettings.bio = bio;

      if (file != (user?.avatar || {})) {
        await updateAvatar(file);
      }
      // Update the user's settings if there are any changes
      if (Object.keys(updatedSettings).length > 0) {
        await updateBusinessSettings({ user, ...updatedSettings });
      }

      toast({
        title: "Settings updated",
        description: "Your settings have been successfully updated.",
        status: "success",
        isClosable: true,
        position: "top",
        duration: 5000,
      });

      onClose(username); // Close the modal after saving the settings
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        status: "error",
        isClosable: true,
        position: "top",
        duration: 5000,
      });
    }
    setUsername(user?.username);
    setLanguages(user?.languages);
    setNatureOfBusiness(user?.natureOfBusiness);
    setPhoneNumber(user?.phoneNumber);
    setBio(user?.bio);
  }

  async function handleSave() {
    try {
      const updatedSettings = {};
      if (username) updatedSettings.username = username;
      if (instruments.length) updatedSettings.instruments = instruments;
      if (genres.length) updatedSettings.genres = genres;
      if (roles.length) updatedSettings.roles = roles;
      if (location) updatedSettings.location = location;
      if (signed) updatedSettings.signed = signed;
      if (bio) updatedSettings.bio = bio;
      if (isProfilePrivate) updatedSettings.isProfileLocked = isProfilePrivate;
      if (file != (user?.avatar || {})) {
        // Update the avatar
        await updateAvatar(file);
      }

      // Update the user's settings if there are any changes
      if (Object.keys(updatedSettings).length > 0) {
        await updateUserSettings({ user, ...updatedSettings });
      }

      toast({
        title: "Settings updated",
        description: "Your settings have been successfully updated.",
        status: "success",
        isClosable: true,
        position: "top",
        duration: 5000,
      });

      onClose(username); // Close the modal after saving the settings
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        status: "error",
        isClosable: true,
        position: "top",
        duration: 5000,
      });
    }
    setUsername(user?.username);
    setInstruments(user?.instrument);
    setGenres(user?.genres);
    setRoles(user?.role);
    setSigned(user?.signed);
    setBio(user?.bio);
    setIsProfilePrivate(user?.isProfileLocked);
  }

  const [instrumentSuggestions, setInstrumentSuggestions] = useState([]);
  const [genreSuggestions, setGenreSuggestions] = useState([]);

  const fetchGenreSuggestions = async (value) => {
    try {
      const usersRef = collection(db, "users");
      const querySnapshot = await getDocs(query(usersRef));
      const users = querySnapshot.docs.map((doc) => doc.data());

      const matchedGenresFromFirestore = new Set();

      users.forEach((user) => {
        user?.genres.forEach((genre) => {
          if (genre.toLowerCase().includes(value.toLowerCase())) {
            matchedGenresFromFirestore.add(genre);
          }
        });
      });

      // Fetch genre suggestions from Firestore
      const firestoreSuggestions = Array.from(matchedGenresFromFirestore);

      // Filter genre suggestions from JSON file
      const matchedGenresFromJSON = genresJSON.filter((g) =>
        g.toLowerCase().includes(value.toLowerCase())
      );
      // Combine the suggestions from Firestore and JSON
      const combinedSuggestions = [
        ...firestoreSuggestions,
        ...matchedGenresFromJSON,
      ];

      setGenreSuggestions(combinedSuggestions);
    } catch (error) {
      // Handle errors, e.g., by only using JSON suggestions
      const matchedGenres = genresJSON.filter((g) =>
        g.toLowerCase().includes(value.toLowerCase())
      );
      setGenreSuggestions(matchedGenres);
      console.log("Error fetching genres suggestions:", error);
    }
  };
  const handleInstrumentChange = (e) => {
    const value = e.target.value;

    // Fetch instrument suggestions
    if (value.length >= 2) {
      axios
        .get(
          `https://musicbrainz.org/ws/2/instrument?query=${value}&limit=5&fmt=json`
        )
        .then((response) => {
          const instruments = response.data.instruments.map(
            (instrument) => instrument.name
          );
          setInstrumentSuggestions(instruments);
        })
        .catch((error) => {
          console.log("Error fetching instrument suggestions:", error);
          setInstrumentSuggestions([]);
        });
    } else {
      setInstrumentSuggestions([]);
    }
  };

  const handleGenreChange = (e) => {
    const value = e.target.value;
    setGenre(value);

    if (value.length >= 2) {
      fetchGenreSuggestions(value);
    } else {
      setGenreSuggestions([]);
    }
  };

  const rolesAvailable = [
    "Musician",
    "Record Producer",
    "Sound Technician",
    "Producer",
    "DJ",
    "Singer",
    "Songwriter",
    "Manager",
    "Music Journalist",
    "Radio Personality",
    "Mixing Engineer",
  ];

  const sortedRoles = rolesAvailable.sort((a, b) => a.localeCompare(b));

  const [signed, setSigned] = useState(user?.signed);
  const [usernameAlternatives, setUsernameAlternatives] = useState([]);
  const [businessLocation, setBusinessLocation] = useState(
    user?.locations || []
  );

  function onClose(username) {
    onCloseModal();
    window.location.href = `${PROTECTED}/profile/${username}`;
  }

  const [showOtherBusinessTextField, setShowOtherBusinessTextField] =
    useState(false);
  const [otherBusiness, setOtherBusiness] = useState("");

  const handleBusinessCategorySelectChange = (event) => {
    const { value } = event.target;
    if (value === "Other") {
      setNatureOfBusiness(natureOfBusiness, value);
      setShowOtherBusinessTextField(true);
    } else {
      setShowOtherBusinessTextField(false);
      setOtherBusiness("");
      setNatureOfBusiness(natureOfBusiness, value);
    }
  };

  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [businessCategories, setBusinessCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = () => {
      setBusinessCategories(industries.industryCategories);
    };

    return () => fetchCategories();
  }, []);

  const handleAddLanguage = (value) => {
    const selectedLanguage = value;

    if (selectedLanguage && !languages.includes(selectedLanguage)) {
      const updatedLanguages = [...languages, selectedLanguage];
      setSelectedLanguages(updatedLanguages);
      setLanguages(updatedLanguages);
    }
  };

  const handleRemoveLanguage = (language) => {
    const updatedLanguages = languages.filter((lang) => lang !== language);
    setSelectedLanguages(updatedLanguages);
    setLanguages(updatedLanguages);
  };

  const handlePhoneNumberChange = (value) => {
    const phone = value.replace(/\D/g, ""); // Remove non-numeric characters
    setPhoneNumber(phone);
  };

  if (authLoading || settingsLoading) return "Loading...";

  return (
    <>
      {!user.businessName ? (
        <Modal isOpen={isOpen} onClose={onCloseModal}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Edit Profile</ModalHeader>
            <ModalCloseButton />

            {authLoading ? (
              <Spinner />
            ) : (
              <ModalBody>
                <HStack spacing={5}>
                  <Avatar user={user} overrideAvatar={fileURL} />
                  <FormControl py={4}>
                    <FormLabel htmlFor="picture">Change avatar</FormLabel>
                    <Input
                      type={"file"}
                      accept="image/*"
                      onChange={(e) => handleChange(e)}
                    />
                  </FormControl>                    
                </HStack>
                <VStack spacing={4} mt={4}>
                  <FormControl>
                    <FormLabel>Username (@{user?.username})</FormLabel>
                    <Input
                      type="text"
                      onChange={async (e) => {
                        const { exists, alternatives } = await isUsernameExists(
                          e.target.value
                        );
                        if (exists) {
                          setUsernameAlternatives(alternatives); // Set alternatives
                        } else {
                          setUsernameAlternatives([]); // Clear any previous alternatives
                        }
                        setUsername(e.target.value);
                      }}
                    />
                    {usernameAlternatives.length > 0 && (
                      <>
                        <Text>Alternative usernames:</Text>
                        {usernameAlternatives.map((alternative, index) => (
                          <Button
                            key={alternative + index}
                            backgroundColor="transparent"
                            onClick={() => setUsername(alternative)}
                          >
                            {alternative}
                          </Button>
                        ))}
                      </>
                    )}
                  </FormControl>
                  <FormControl>
                    <FormLabel>Instruments</FormLabel>
                    <HStack spacing={2} flexWrap="wrap">
                      {instruments &&
                        instruments.map((instrument, index) => (
                          <Badge
                            key={instrument + index}
                            colorScheme="green"
                            px={2}
                            py={1}
                            rounded="md"
                          >
                            {instrument}
                            <IconButton
                              size="xs"
                              icon={<CloseIcon />}
                              variant="ghost"
                              onClick={() => deleteInstrument(instrument)}
                            />
                          </Badge>
                        ))}
                    </HStack>
                    <Input
                      type="text"
                      placeholder="Add an instrument"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.target.value) {
                          addInstrument(e.target.value);
                          e.target.value = "";
                        }
                      }}
                      onChange={handleInstrumentChange}
                    />
                    {instrumentSuggestions.length > 0 && (
                      <Box mt="1">
                        {instrumentSuggestions.map((suggestion, index) => (
                          <Button
                            key={suggestion + index}
                            variant="outline"
                            colorScheme="blue"
                            size="sm"
                            onClick={() => {
                              addInstrument(suggestion);
                              setInstrumentSuggestions([]);
                            }}
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </Box>
                    )}
                    <Text mt={2} fontSize="sm" color="gray.500">
                      Existing instruments:
                    </Text>
                    <Text fontSize={"xs"}>Select the wanted instruments</Text>
                    <Wrap>
                      {existingInstruments.map((instrument, index) => (
                        <WrapItem key={instrument + index}>
                          <Badge
                            colorScheme={
                              instruments.includes(instrument)
                                ? "green"
                                : "gray"
                            }
                            px={2}
                            py={1}
                            rounded="md"
                            cursor="pointer"
                            onClick={() => addInstrument(instrument)}
                          >
                            {instrument}
                          </Badge>
                        </WrapItem>
                      ))}
                    </Wrap>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Genres</FormLabel>
                    <HStack spacing={2} flexWrap="wrap">
                      {genres &&
                        genres?.map((genress, index) => (
                          <Badge
                            key={genress + index}
                            colorScheme="green"
                            px={2}
                            py={1}
                            rounded="md"
                          >
                            {genress}
                            <IconButton
                              size="xs"
                              icon={<CloseIcon />}
                              variant="ghost"
                              onClick={() => deleteGenre(genress)}
                            />
                          </Badge>
                        ))}
                    </HStack>
                    <Input
                      type="text"
                      placeholder="Add a Genre"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.target.value) {
                          addGenre(e.target.value);
                          e.target.value = "";
                        }
                      }}
                      onChange={handleGenreChange}
                    />
                    {genreSuggestions.length > 0 && (
                      <Box mt="1">
                        {genreSuggestions.map((suggestion, index) => (
                          <Button
                            key={suggestion + index}
                            variant="outline"
                            colorScheme="blue"
                            size="sm"
                            onClick={() => {
                              addGenre(suggestion);
                              setGenreSuggestions([]);
                            }}
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </Box>
                    )}
                    <Text mt={2} fontSize="sm" color="gray.500">
                      Existing Genres:
                    </Text>
                    <Text fontSize={"xs"}>Select the wanted Genre</Text>
                    <Wrap>
                      {existingGenres.map((genress, index) => (
                        <WrapItem key={genress + index}>
                          <Badge
                            colorScheme={
                              genres.includes(genress) ? "green" : "gray"
                            }
                            px={2}
                            py={1}
                            rounded="md"
                            cursor="pointer"
                            onClick={() => addGenre(genress)}
                          >
                            {genress}
                          </Badge>
                        </WrapItem>
                      ))}
                    </Wrap>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Roles</FormLabel>
                    <Select
                      placeholder="Select role"
                      onChange={(e) => setRoles(e.target.value)}
                      value={roles}
                    >
                      {sortedRoles.map((role, index) => (
                        <option key={role + index} value={role}>
                          {role}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Signed</FormLabel>
                    <Select
                      placeholder="Are you signed?"
                      onChange={(e) => setSigned(e.target.value)}
                      value={signed}
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Locations</FormLabel>
                    <PlacesAutocomplete
                      setLocation={setLocation}
                      prevLocation={user?.location}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Bio</FormLabel>
                    <Input
                      type="text"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                    />
                  </FormControl>
                </VStack>
                <Button
                  loadingText="Saving..."
                  w="full"
                  mt={8}
                  colorScheme="teal"
                  onClick={handleSave}
                  isLoading={fileLoading || settingsLoading}
                  isDisabled={
                    !username.trim() &&
                    instruments.length === 0 &&
                    roles.length === 0 &&
                    !location.trim()
                  }
                >
                  Save
                </Button>
              </ModalBody>
            )}
          </ModalContent>
        </Modal>
      ) : (
        <Modal isOpen={isOpen} onClose={onCloseModal}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Edit Profile</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <HStack spacing={5}>
                <Avatar user={user} overrideAvatar={fileURL} />
                <FormControl py={4}>
                  <FormLabel htmlFor="picture">Change avatar</FormLabel>
                  <Input
                    type={"file"}
                    accept="image/*"
                    onChange={(e) => handleChange(e)}
                  />
                </FormControl>
              </HStack>
              <VStack spacing={4} mt={4}>
                <FormControl>
                  <FormLabel>Username (@{user?.username})</FormLabel>
                  <Input
                    type="text"
                    onChange={async (e) => {
                      const { exists, alternatives } = await isUsernameExists(
                        e.target.value
                      );
                      if (exists) {
                        setUsernameAlternatives(alternatives); // Set alternatives
                      } else {
                        setUsernameAlternatives([]); // Clear any previous alternatives
                      }
                      setUsername(e.target.value);
                    }}
                  />
                  {usernameAlternatives.length > 0 && (
                    <>
                      <Text>Alternative usernames:</Text>
                      {usernameAlternatives.map((alternative, index) => (
                        <Button
                          key={alternative + index}
                          backgroundColor="transparent"
                          onClick={() => setUsername(alternative)}
                        >
                          {alternative}
                        </Button>
                      ))}
                    </>
                  )}
                </FormControl>
                <Flex direction="column" width={"100%"}>
                  <AddressAutocomplete
                    setBusinessLocation={setBusinessLocation}
                    businessLocation={businessLocation}
                  />
                </Flex>
                <FormControl py="2">
                  <FormLabel>Phone Number</FormLabel>
                  <InputGroup>
                    <PhoneInput
                      country=""
                      inputProps={{
                        name: "phoneNumber",
                        required: "Phone Number is required",
                      }}
                      value={phoneNumber}
                      onChange={handlePhoneNumberChange}
                    />
                  </InputGroup>
                </FormControl>
                <FormControl py="2">
                  <FormLabel>Nature of Business</FormLabel>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <Box color="gray.300" display="flex" alignItems="center">
                        <Icon as={BiWorld} color="gray" h="6" w="6" />
                      </Box>
                    </InputLeftElement>
                    <Select
                      placeholder="Select your business"
                      ml={10}
                      value={
                        businessCategories.includes(natureOfBusiness)
                          ? natureOfBusiness
                          : "Other"
                      }
                      onChange={(e) => {
                        setNatureOfBusiness(e.target.value);
                      }}
                    >
                      {businessCategories.map((business, index) => (
                        <option key={business + index} value={business}>
                          {business}
                        </option>
                      ))}
                      <option value="Other">Other</option>
                    </Select>
                  </InputGroup>
                  {showOtherBusinessTextField && (
                    <Input
                      type="text"
                      placeholder="Enter other business"
                      value={
                        !businessCategories.includes(natureOfBusiness)
                          ? natureOfBusiness
                          : otherBusiness
                      }
                      onChange={(e) => {
                        if (!businessCategories.includes(natureOfBusiness)) {
                          setNatureOfBusiness(e.target.value);
                        } else {
                          setOtherBusiness(e.target.value);
                        }
                      }}
                      mt={2}
                      required="Nature of Business required"
                    />
                  )}
                </FormControl>
                <FormControl py="2">
                  <FormLabel>Languages</FormLabel>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <Box color="gray.300" display="flex" alignItems="center">
                        <Icon as={BiWorld} color="gray" h="6" w="6" />
                      </Box>
                    </InputLeftElement>
                    <Select
                      placeholder="Select your language"
                      value={selectedLanguages}
                      ml={10}
                      onChange={(e) => setSelectedLanguages(e.target.value)}
                    >
                      {languageOptions.map((language, index) => (
                        <option
                          key={language.value + index}
                          value={language.value}
                        >
                          {language.value}
                        </option>
                      ))}
                    </Select>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      onClick={() => handleAddLanguage(selectedLanguages)}
                    >
                      +
                    </Button>
                  </InputGroup>
                </FormControl>
                <Flex direction="row" mt="4" flexWrap="wrap">
                  {languages?.map((language, index) => (
                    <Box
                      key={language + index}
                      mr={2}
                      mt={2}
                      position="relative"
                    >
                      <Flex alignItems="center">
                        <Badge
                          variant="solid"
                          colorScheme="blue"
                          borderRadius="md"
                          px="2"
                          py="1"
                          display="inline-flex"
                          alignItems="center"
                        >
                          {language}
                        </Badge>
                        <CloseButton
                          size="sm"
                          ml={2}
                          onClick={() => handleRemoveLanguage(language)}
                        />
                      </Flex>
                    </Box>
                  ))}
                </Flex>
                <FormControl>
                  <FormLabel>Bio</FormLabel>
                  <Input
                    type="text"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </FormControl>
              </VStack>
              <Button
                loadingText="Saving..."
                w="full"
                mt={8}
                colorScheme="teal"
                onClick={handleSaveBusiness}
                isLoading={fileLoading || settingsLoading}
                isDisabled={
                  !username.trim() &&
                  instruments.length === 0 &&
                  roles.length === 0 &&
                  !location.trim()
                }
              >
                Save
              </Button>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </>
  );
}
