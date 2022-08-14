Feature: Screen Share takeover =>
  Screen share takeover
  user A displays screen (publisher)
  User B performs screen share
  User B displays screen (publisher)
  User A becomes listener

  @TMU-17732
  @takeover
  @screen-share
  Scenario: Screen share take over
    Given System is running on MCU_HOME
    Given create conference 100106
    When create audio room for host chandler
    And add participant:
      | Participant |roomType | meetingID |
      | chandler    |audio    | context   |
      | ross        |audio    | context   |
    When create screen-share room for host chandler
    Then ross is publisher
#    #perfrom "take over"
    Then chandler is publisher
    And leave participant:
      | Participant |roomType     | meetingID |
      | chandler    |screen-share | context   |
      | chandler    |audio        | context   |
      | ross        |audio        | context   |
    Then destroy screen-share room
    Then destroy audio room

  @TMU-19521
  @screen-share
  Scenario: Modify stream
    Given System is running on MCU_HOME
    Given create conference 100107
    When create audio room for host chandler
    And add participant:
      | Participant |roomType | meetingID |
      | chandler    |audio    | context   |
      | ross        |audio    | context   |
    When create screen-share room for host chandler
    Then ross is publisher
    #modify stream requires an action, default value is 'undefined'
    Then ross does modify
    And leave participant:
      | Participant |roomType     | meetingID |
      | ross        |screen-share | context   |
      | chandler    |audio        | context   |
      | ross        |audio        | context   |
    Then destroy screen-share room
    Then destroy audio room

  @TMU-18531
  @screen-share
  Scenario: 4 Publishers in same time
    Given System is running on MCU_HOME
    Given create conference 100112666
    When create audio room for host chandler
    And add participant:
      | Participant |roomType | meetingID |
      | chandler    |audio    | context   |
      | ross        |audio    | context   |
      | joey        |audio    | context   |
      | rachel      |audio    | context   |
    When create screen-share room for host chandler
    And add participant:
      | Participant |roomType     | meetingID |
      | chandler    |screen-share | context   |
      | ross        |screen-share | context   |
      | joey        |screen-share | context   |
      | rachel      |screen-share | context   |
    And leave participant:
      | Participant |roomType     | meetingID |
      | joey        |screen-share | context   |
      | rachel      |screen-share | context   |
      | ross        |screen-share | context   |
      | chandler    |screen-share | context   |
      | joey        |audio        | context   |
      | rachel      |audio        | context   |
      | chandler    |audio        | context   |
      | ross        |audio        | context   |
    Then destroy screen-share room
    Then destroy audio room

  @TMU-11518
  @screen-share
  Scenario: SS reInvite
    Given System is running on MCU_HOME
    Given create conference 100109
    When create audio room for host chandler
    And add participant:
      | Participant | meetingID | roomType      |
      | chandler    | context   | audio   |
      | ross   | context   | audio   |
    When create screen-share room for host chandler
    Then chandler is publisher
    And chandler reInvite in screen-share roomType as SENDRECV
    Then destroy screen-share room
    Then destroy audio room

  @TMU-19522
  @screen-share
  Scenario: same user start SS twice
    Given System is running on MCU_HOME
    Given create conference 100110
    When create audio room for host chandler
    And add participant:
      | Participant |roomType | meetingID |
      | chandler    |audio    | context   |
      | ross        |audio    | context   |
    When create screen-share room for host ross
    Then ross is publisher
    Then ross is publisher
    And leave participant:
      | Participant |roomType     | meetingID |
      | ross        |screen-share | context   |
      | chandler    |audio        | context   |
      | ross        |audio        | context   |
    Then destroy screen-share room
    Then destroy audio room

  @TMU-19523
  @screen-share
  Scenario: open SS room before open audio room
    Given System is running on MCU_HOME
    Given create conference 100111
    When create screen-share room for host chandler
    Then chandler is publisher
    When create audio room for host chandler
    And add participant:
      | Participant |roomType | meetingID |
      | chandler    |audio    | context   |
      | ross        |audio    | context   |
    And leave participant:
      | Participant |roomType     | meetingID |
      | chandler    |screen-share | context   |
      | chandler    |audio        | context   |
      | ross        |audio        | context   |
    Then destroy screen-share room
    Then destroy audio room

  @TMU-20031
  @error-test
  @screen-share
  Scenario: add SS user to not exist SS meeting
    Given System is running on MCU_HOME
    Given create conference 100112
    When create audio room for host chandler
    And add participant:
      | Participant |roomType | meetingID |
      | chandler    |audio    | context   |
      | ross        |audio    | context   |
    When create screen-share room for host chandler
    And add participant chandler with meetingID context and roomType screen-share with error NOT_EXIST_MEETING
    And leave participant:
      | Participant |roomType     | meetingID |
      | chandler    |audio        | context   |
      | ross        |audio        | context   |
    Then destroy screen-share room
    Then destroy audio room

  @TMU-20032
  @error-test
  @screen-share
  Scenario: no publisher is SS SDP - return Error on SDP
    Given System is running on MCU_HOME
    Given create conference 100113
    When create audio room for host chandler
    And add participant:
      | Participant |roomType | meetingID |
      | chandler    |audio    | context   |
      | ross        |audio    | context   |
    When create screen-share room for host chandler
    And add participant chandler in meetingID context with roomType screen-share with sdp error NO_PUBLISHER_IN_SS_SDP
    Then chandler should get errorCode: 415, errorReason: Received INVITE with wrong SDP. No lestiner or publisher response on INVITE screen-share roomType
    And leave participant:
      | Participant |roomType     | meetingID |
      | chandler    |audio        | context   |
      | ross        |audio        | context   |
    Then destroy screen-share room
    Then destroy audio room


#  @TMU-17739
#  @takeover
#  @screen-share
#  Scenario: Screen share reconnect
#    Given System is running on MCU_HOME
#    Given create conference 100114
#    When create audio room for host chandler
#    And add participant:
#      | Participant |roomType | meetingID |
#      | chandler    |audio    | context   |
#      | ross        |audio    | context   |
#    When create screen-share room for host ross
#    Then ross is publisher
#    And ross reInvite in screen-share roomType as SSPublisher-
#    And leave participant:
#      | Participant |roomType     | meetingID |
#      | ross        |screen-share | context   |
#      | chandler    |audio        | context   |
#      | ross        |audio        | context   |
#    Then destroy screen-share room
#    Then destroy audio room


#  Scenario: Modify stream error case
#    Given System is running on MCU_HOME
#    Given create conference 100107
#    When create audio room 100108 for host chandler
#    When create audio room 100108 for host chandler
#    And add participant:
#      | Participant |roomType | meetingID |
#      | chandler    |audio    | context   |
#      | ross        |audio    | context   |
#    Then Sleep 1 sec
#    When create screen-share room 100108 for host chandler
#    Then ross is publisher
#    #modify stream requires an action, default value is 'undefined'
#    Then ross does modify with wrong connection
#    And leave participant:
#      | Participant |roomType     | meetingID |
#      | ross        |screen-share | context   |
#      | chandler    |audio        | context   |
#      | ross        |audio        | context   |
#    Then destroy screen-share room 100108
#    Then destroy audio room 100108
