import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import toggleHelper from "../customHooks/toggleHelper";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import { firebaseConfig } from "../pages/index";
import { initializeApp } from "firebase/app";
import { getAuth, signOut } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { getDatabase, onValue, ref } from "firebase/database";
import { handleUser, updateNotifications } from "../provider/userSlice";
import { refreshUser } from "../provider/userSlice";
import Image from "next/image";
import styles from "../styles/Header.module.css";
import { Avatar } from "@mui/material";
import Badge from "@mui/material/Badge";
import Tooltip from "@mui/material/Tooltip";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import NotificationsIcon from "@mui/icons-material/Notifications";
import SearchIcon from "@mui/icons-material/Search";
import GroupsIcon from "@mui/icons-material/Groups";
import OtherHousesIcon from "@mui/icons-material/OtherHouses";
import OtherHousesRoundedIcon from "@mui/icons-material/OtherHousesRounded";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { switchBg } from "../pages/api/database";
import { handleBgSwitch } from "../provider/darkSlice";

function Header() {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const [User] = useAuthState(auth);
  const dispatch = useDispatch();
  const router = useRouter();
  const selector = useSelector(handleUser);
  const user = selector.payload.userSlice.value;
  const users = selector.payload.allUsersSlice.value;
  const rooms = selector.payload.allRoomsSlice.value;
  const background = selector.payload.darkSlice.value;
  const [drop, setDrop] = useState(false);
  const [count, setCount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // add search functionality
  const [search, setSearch] = useState("");
  const [usersSearchResults, setUsersSearchResults] = useState([]);
  const [roomsSearchResults, setRoomsSearchResults] = useState([]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const handleBackground = () => {
    switchBg(User.uid, !background);
    // change the background of the document.body
  };

  const handleSignOut = () => {
    dispatch(refreshUser());
    signOut(auth);
    router.push("/");
  };

  // search functionality
  useEffect(() => {
    if (search.length > 0) {
      // search for users and rooms
      const userResults =
        users &&
        Object.keys(users)?.filter((user) =>
          users[user].name.toLowerCase().includes(search.toLowerCase())
        );
      const roomResults =
        rooms &&
        Object.keys(rooms)?.filter((room) =>
          rooms[room].name.toLowerCase().includes(search.toLowerCase())
        );
      setUsersSearchResults(userResults);
      setRoomsSearchResults(roomResults);
      console.log("filled", [userResults, roomResults]);
    } else {
      setUsersSearchResults([]);
      setRoomsSearchResults([]);
    }
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDrop = () => {
    setDrop(!drop);
  };

  const dropRef = useRef(null);
  const [listening, setListening] = useState(false);
  /* eslint-disable */
  useEffect(toggleHelper(listening, setListening, dropRef, setDrop));

  const db = getDatabase();
  const notifCountRef = ref(db, "users/" + `${User?.uid}/notifCount`);

  useEffect(() => {
    if (router.pathname === "/notifications") {
      setCount(0);
    }
  }, []);

  useEffect(() => {
    if (router.isReady) {
      if (user.notifications && User) {
        dispatch(updateNotifications(users[User.uid]?.notifications));
        // filter the unseen notifications and set the count to the number of unseen notifications
        const unseen = Object.keys(user.notifications).filter(
          (key) => user.notifications[key].seen === false
        );
        setCount(unseen.length);
      }
    }
  }, [users, user, dispatch, router]);

  useEffect(() => {
    if (window.innerWidth <= 900) {
      setIsMobile(true);
    } else {
      setIsMobile(false);
    }
  }, [window.innerWidth]);

  useEffect(() => {
    // set the background to the value of the user's background in the database
    const bgRef = ref(db, "users/" + `${User?.uid}/background`);
    onValue(bgRef, (snapshot) => {
      dispatch(handleBgSwitch(snapshot.val()));
    });
  }, [background, dispatch]);

  useEffect(() => {
    if (background) {
      document.body.classList.add("bodyDark");
    } else {
      document.body.classList.remove("bodyDark");
    }
  }, [background]);

  return (
    <div ref={dropRef} onClick={drop ? () => setDrop(false) : () => {}}>
      <header
        className={styles.Header}
        id={background === true ? styles.HeaderDark : null}
      >
        <div className={styles.headerCon}>
          <Link href="/">
            <div className={styles.logo}>
              <Image
                src={
                  window.innerWidth < 768
                    ? "/assets/clann/1.png"
                    : background === true
                    ? "/assets/clann/2.png"
                    : "/assets/clann/3.png"
                }
                alt="logo"
                height={window.innerWidth < 768 ? 150 : 250}
                width={window.innerWidth < 768 ? 150 : 250}
              />
            </div>
          </Link>
          <div
            className={styles.search}
            id={background === true ? styles.searchDark : null}
          >
            <div
              className={styles.btn}
              id={background === true ? styles.btnDark : null}
            >
              <SearchIcon
                sx={{
                  color: "#707070",
                  width: isMobile ? "18px" : "20px",
                  height: isMobile ? "18px" : "20px",
                  position: "relative",
                  top: isMobile ? "0.4rem" : "0.3rem",
                  left: "1rem",
                }}
              />
            </div>
            <input
              value={search}
              onChange={handleSearch}
              type="search"
              name=""
              id=""
              placeholder={
                !isMobile ? `Looking for a room, ${user.name}?` : "Search"
              }
            />
          </div>
          {usersSearchResults.length > 0 || roomsSearchResults.length > 0 ? (
            <div
              className={styles.searchDrop}
              id={background === true ? styles.searchDropDark : null}
            >
              {users && usersSearchResults.length > 0
                ? usersSearchResults.map((user) => (
                    <div
                      className={styles.searchCon}
                      key={Math.random() + users[user].name}
                      onClick={() => {
                        router.push(`/user/${users[user].username}`);
                      }}
                    >
                      <div className={styles.searchPic}>
                        <Avatar
                          src={users[user].profile_pic}
                          alt={users[user].name}
                          sx={{
                            height: "25px",
                            width: "25px",
                          }}
                        />
                      </div>
                      <div className={styles.desCon}>
                        <div className={styles.searchName}>
                          {users[user].name}
                        </div>
                        <div className={styles.searchDesc}>User</div>
                      </div>
                    </div>
                  ))
                : null}
              {rooms && roomsSearchResults.length > 0
                ? roomsSearchResults.map((room) => (
                    <div
                      className={styles.searchCon}
                      key={Math.random() + rooms[room].name}
                      onClick={
                        rooms[room].inSession === false &&
                        rooms[room]?.createdBy.name !== user.name
                          ? null
                          : () => {
                              router.push(`/room/${room}`);
                            }
                      }
                    >
                      <div className={styles.searchPic}>
                        <OtherHousesRoundedIcon
                          sx={{
                            color: "#8c52ff",
                            height: "25px",
                            width: "25px",
                          }}
                        />
                      </div>
                      <div className={styles.desCon}>
                        <div className={styles.searchName}>
                          {rooms[room].name}
                        </div>
                        <div className={styles.searchDesc}>{`Room(${
                          rooms[room].inSession === false &&
                          rooms[room]?.createdBy.name !== user.name
                            ? "Locked"
                            : "Open"
                        })`}</div>
                      </div>
                    </div>
                  ))
                : null}
            </div>
          ) : null}
          <div className={styles.profile}>
            {window.innerWidth < 768 ? null : (
              <Link href="/popular">
                <Tooltip title="Popular" arrow>
                  <WhatshotIcon
                    fontSize="small"
                    sx={{
                      color: "#707070",
                      position: "relative",
                      top: "0.7rem",
                      left: "0.2rem",
                    }}
                  />
                </Tooltip>
              </Link>
            )}

            {window.innerWidth < 768 ? null : (
              <Link href="/notifications">
                <Tooltip title="Notifications" arrow>
                  <Badge
                    badgeContent={count}
                    color="error"
                    sx={{
                      height: "fit-content",
                      color: "#707070",
                      position: "relative",
                      top: "0.7rem",
                    }}
                  >
                    <NotificationsIcon fontSize="small" />
                  </Badge>
                </Tooltip>
              </Link>
            )}

            {window.innerWidth < 768 ? null : (
              <Link href="/friends">
                <Tooltip title="Friends" arrow>
                  <GroupsIcon
                    sx={{
                      color: "#707070",
                      position: "relative",
                      top: "0.7rem",
                    }}
                  />
                </Tooltip>
              </Link>
            )}

            {window.innerWidth < 768 ? null : (
              <Link href="/favorites">
                <Tooltip title="Favorites" arrow>
                  <OtherHousesIcon
                    fontSize="small"
                    sx={{
                      color: "#707070",
                      position: "relative",
                      top: "0.7rem",
                    }}
                  />
                </Tooltip>
              </Link>
            )}

            <div
              className={drop ? styles.pdActive : styles.profileDrop}
              id={
                drop
                  ? background === true
                    ? styles.pdActiveDark
                    : null
                  : background === true
                  ? styles.profileDropDark
                  : null
              }
              onClick={handleDrop}
            >
              <Avatar
                alt={user.name}
                src={user.profile_pic}
                sx={{
                  height: isMobile ? "25px" : "30px",
                  width: isMobile ? "25px" : "30px",
                  position: "relative",
                  top: "0.4rem",
                  right: "0.12rem",
                }}
              />
              <ArrowDropDownIcon
                sx={{
                  color: "#707070",
                  position: "relative",
                  top: "0.55rem",
                  left: "0.45rem",
                }}
              />
            </div>
          </div>
        </div>
      </header>
      <div
        className={drop ? styles.dropDown : styles.noDrop}
        id={background === true ? styles.dropDownDark : null}
      >
        <div className={styles.dropCon}>
          {isMobile ? (
            <>
              <Link href={"/"}>
                <div className={styles.dropDownItem}>Home</div>
              </Link>

              <Link href="/create">
                <div className={styles.dropDownItem}>Create</div>
              </Link>

              <Link href="/favorites">
                <div className={styles.dropDownItem}>Favorites</div>
              </Link>

              <Link href="/notifications">
                <div className={styles.dropDownItem}>
                  {count > 0 ? (
                    <Badge color="error" variant="dot">
                      Notifications
                    </Badge>
                  ) : (
                    "Notifications"
                  )}
                </div>
              </Link>
            </>
          ) : null}
          <Link href={`/user/${user.username}`}>
            <div className={styles.dropDownItem}>Profile</div>
          </Link>

          <Link href="/settings">
            <div className={styles.dropDownItem}>User settings</div>
          </Link>

          <Link href="/">
            <div className={styles.dropDownItem}>About</div>
          </Link>

          <div className={styles.dropDownItem} onClick={handleBackground}>
            {background === false ? "Dark Mode" : "Light Mode"}
          </div>
          {!isMobile ? null : (
            <div className={styles.dropDownItem} onClick={handleSignOut}>
              Sign Out
            </div>
          )}
        </div>

        <div className={styles.copyRight}>© 2022 Clann</div>
      </div>
    </div>
  );
}

export default Header;
