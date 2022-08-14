Feature: mMCU Load test


#  @TMU-20825
#  @TMU-20826
#  Scenario: Load without stream
#    When set: ADDRESS MCU_HOME, USERS USERS, SPEAK_USERS SPEAK_USERS, VIDEO_PUB_USERS VIDEO_PUB_USERS, ROOMS ROOMS, FAILURE_MECHANISM FAILURE_MECHANISM
#    And open audio rooms with participants with delay of 10 seconds between rooms
#    And open DC rooms with participants
#    And mute NOT SPEAK_USERS with delay of 0 seconds between rooms
#    And close audio rooms with participants with delay of 0 seconds between rooms
#    And close DC rooms with participants
#    And validate failures threshold less then 10% in case FAILURE_MECHANISM set to TRUE




    @TMU-20823
    @TMU-20824
  Scenario: Load with stream
    When set: ADDRESS MCU_HOME, USERS USERS, ROOMS ROOMS -, SPEAK_USERS SPEAK_USERS, VIDEO_PUB_USERS VIDEO_PUB_USERS, FAILURE_MECHANISM FAILURE_MECHANISM
    And open audio rooms with participants and stream and mute NOT SPEAK_USERS with delay of DELAY_BETWEEN_CREATE_ROOMS seconds between rooms and DELAY_BETWEEN_CREATE_USERS seconds between users
    And Sleep DURATION sec
    And stop stream with delay of DELAY_BETWEEN_STOP_STREAM seconds between rooms in case STREAM set to TRUE
    And close audio rooms with participants with delay of DELAY_BETWEEN_CLOSE_ROOMS seconds between rooms
    Then validate num of streams files for each participant in case STREAM set to TRUE
   # Then validate streams file size sd is less then EXPECTED_SD MB in case STREAM set to TRUE
    And validate failures threshold less then EXPECTED_FAILURE_THRESHOULD% in case FAILURE_MECHANISM set to TRUE


#  Scenario Outline: Load with stream, setup: USERS <USERS>, SPEAK_USERS <SPEAK_USERS>, VIDEO_PUB_USERS <VIDEO_PUB_USERS>, ROOMS <ROOMS>, FAILURE_MECHANISM <FAILURE_MECHANISM>
#    When set: ADDRESS MCU_HOME, USERS <USERS>, SPEAK_USERS <SPEAK_USERS>, VIDEO_PUB_USERS <VIDEO_PUB_USERS>, ROOMS <ROOMS>, FAILURE_MECHANISM <FAILURE_MECHANISM>
#    And open audio rooms with participants with delay of 1 seconds between rooms
#    And open DC rooms with participants
#    And mute NOT SPEAK_USERS with delay of 0 seconds between rooms
#    And start stream with delay of 0 seconds between rooms in case STREAM set to TRUE
#    And Sleep 30 sec in case STREAM set to TRUE
#    And stop stream with delay of 0 seconds between rooms in case STREAM set to TRUE
#    And close audio rooms with participants with delay of 0 seconds between rooms
#    And close DC rooms with participants
#    Then validate num of streams files for each participant in case STREAM set to TRUE
#    And validate failures threshold less then 10% in case FAILURE_MECHANISM set to TRUE
#
#
#    Examples:
#      | USERS | SPEAK_USERS | VIDEO_PUB_USERS | ROOMS | FAILURE_MECHANISM |
#      |  25   |     2       |       3         | 2     | false             |







