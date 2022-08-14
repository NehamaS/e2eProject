Feature: mMCU Cluster Health - audio pstn =>


  @TMU-19453
  @audio
  @PSTN
  @stream
  Scenario: basic audio conference room PSTN users
    Given System is running on MCU_HOME
    Given create conference 100010
    When create audio room for host chandler
    And add participant:
      | Participant | meetingID | roomType | userType | deviceType |
      | chandler    | context   | audio    | pstn     | PSTN       |
      | ross        | context   | audio    | pstn     | PSTN       |
    And start stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType | streamFile |
      | chandler    | context   | audio    | audio1     |
      | ross        | context   | audio    | audio5     |
    Then Sleep 10 sec in case STREAM set to TRUE
    And leave participant:
      | Participant | meetingID | roomType |
      | ross        | context   | audio    |
      | chandler    | context   | audio    |
    And validate stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType |
      | chandler    | context   | audio    |
      | ross        | context   | audio    |
    And stop stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType |
      | chandler    | context   | audio    |
      | ross        | context   | audio    |
    Then destroy audio room


  @TMU-19452
  @error-test
  @audio
  @PSTN
  Scenario: add PSTN participant with missingCallerID - Expected to get succeed response on header
    Given System is running on MCU_HOME
    Given create conference 100011
    When create audio room for host chandler
    And add participant:
      | Participant | meetingID | roomType | userType | deviceType |
      | chandler    | context   | audio    | pstn     | PSTN       |
    And add non-standart participant ross in meetingID context with userType pstn and deviceType PSTN with header case missingCallerID
    And leave participant:
      | Participant | meetingID | roomType |
      | ross        | context   | audio    |
      | chandler    | context   | audio    |
    Then destroy audio room

#
#  @TMU-19631
#  @audio
#  @PSTN
#  @data-channel
#  Scenario: add PSTN user to data-channel room
#    Given System is running on MCU_HOME
#    Given create conference 100018
#    When create audio room for host chandler
#    When create data-channel room for host chandler
#    And add participant:
#      | Participant | meetingID | roomType     | userType | deviceType |
#      | chandler    | context   | audio        | pstn     | PSTN       |
#      | chandler    | context   | data-channel | pstn     | PSTN       |
#    And leave participant:
#      | Participant | meetingID | roomType     |
#      | chandler    | context   | audio        |
#      | chandler    | context   | data-channel |
#    Then destroy audio room
#    Then destroy data-channel room
#


  @TMU-21562
  @PSTN
  @audio
  @mute
  @stream
  Scenario: audio conference - PSTN user self mute
    Given System is running on MCU_HOME
    Given create conference 100023
    When create audio room for host chandler
    And add participant:
      | Participant | meetingID | roomType | userType | deviceType |
      | chandler    | context   | audio    |          |            |
      | ross        | context   | audio    | pstn     | PSTN       |
    And start stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType | streamFile |
      | chandler    | context   | audio    | audio1     |
      | ross        | context   | audio    | audio5     |
    And mute ross
    Then Sleep 10 sec in case STREAM set to TRUE
    And unmute ross
    Then Sleep 10 sec in case STREAM set to TRUE
    And leave participant:
      | Participant | meetingID | roomType |
      | ross        | context   | audio    |
      | chandler    | context   | audio    |
    And validate stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType |
      | chandler    | context   | audio    |
      | ross        | context   | audio    |
    And stop stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType |
      | chandler    | context   | audio    |
      | ross        | context   | audio    |
    Then destroy audio room

  @ITAY-TEST
  @TMU-21563
  @PSTN
  @audio
  @mute
  @stream
  Scenario: audio conference - mute all include PSTN user
    Given System is running on MCU_HOME
    Given create conference 100024
    When create audio room for host chandler
    And add participant:
      | Participant | meetingID | roomType | userType | deviceType |
      | chandler    | context   | audio    |          |            |
      | ross        | context   | audio    | pstn     | PSTN       |
      | joey        | context   | audio    |          |            |
    And start stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType | streamFile |
      | chandler    | context   | audio    | audio1     |
      | ross        | context   | audio    | audio5     |
      | joey        | context   | audio    | audio3     |
    And joey muteAll
    Then Sleep 10 sec in case STREAM set to TRUE
    And joey unmuteAll
    Then Sleep 10 sec in case STREAM set to TRUE
    And leave participant:
      | Participant | meetingID | roomType |
      | joey        | context   | audio    |
      | ross        | context   | audio    |
      | chandler    | context   | audio    |
    And validate stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType |
      | chandler    | context   | audio    |
      | ross        | context   | audio    |
      | joey        | context   | audio    |
    And stop stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType |
      | chandler    | context   | audio    |
      | ross        | context   | audio    |
      | joey        | context   | audio    |
    Then destroy audio room

  @TMU-22712
  @PSTN
  Scenario: add pstn user on hold
    Given System is running on MCU_HOME
    Given create conference 100025
    When create audio room for host chandler
    And add participant chandler with meetingID context and roomType audio with caseType INVITE_PSTN_ON_HOLD
    And chandler reInvite in audio roomType as PSTN
    And leave participant:
      | Participant | meetingID | roomType |
      | chandler    | context   | audio    |
    Then destroy audio room


  @TMU-30558
  @MCU-2800
  @PSTN
  Scenario: Users are not disconnect after PSTN user leave the meeting
    Given System is running on MCU_HOME
    Given create conference 100030
    When create audio room for host chandler
    And add participant:
      | Participant | meetingID | roomType     | userType | deviceType |
      | chandler    | context   | audio        |          |            |
      | ross        | context   | audio        |          |            |
      | joey        | context   | audio        | pstn     | PSTN       |
    And leave participant:
      | Participant | meetingID | roomType     |
      | joey        | context   | audio        |
    Then Sleep 5 sec in case STREAM set to TRUE
    And leave participant:
      | Participant | meetingID | roomType     |
      | ross        | context   | audio        |
      | chandler    | context   | audio        |
    Then destroy audio room


