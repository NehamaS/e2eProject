Feature: DTMF =>

  @sanity
  @DTMF
  @TMU-196341
  Scenario: add user via DTMF
    Given System is running on MCU_HOME
    Given create conference 120001
    When create audio room for host dummy_user1
    And add participant dummy_user1 with meetingID context with caseType DTMF_USER and infoType PLAY_COLLECT
    And leave participant:
      | Participant | meetingID | roomType |
      | dummy_user1  | context   | audio    |
    Then destroy audio room
#
#  @sanity
#  @DTMF
#  @TMU-19643
#  Scenario: user dial-in to conference
#    Given System is running on MCU_HOME
#    Given create conference 120002
#    When create audio room for host chandler
#    And add participant chandler with meetingID context and roomType audio with caseType DIAL_IN
#    And leave participant:
#      | Participant | meetingID | roomType      |
#      | chandler    | context   | audio         |
#    Then destroy audio room


  @sanity
  @DTMF
  @TMU-19643
  Scenario: user dial-in to conference, infoType PLAY_COLLECT
    Given System is running on MCU_HOME
    Given create conference 120002
    When create audio room for host dummy_user2
    And add participant dummy_user2 with meetingID context with caseType DIAL_IN and infoType PLAY_COLLECT
    And start stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType | streamFile |
      | dummy_user2 | context   | audio    | dtmf_123#  |
    Then validate INFO is received after 10 sec for dummy_user2 with messageIndex 1 and name: dtmf.detect DTMFs: 123# and 4 digits
    Then validate INFO is received after 10 sec for chandler with messageIndex 2 and name: msml.dialog.exit
    Then Sleep 10 sec in case STREAM set to TRUE
    And validate stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType |
      | dummy_user2 | context   | audio    |
    And stop stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType |
      | dummy_user2 | context   | audio    |
    And leave participant:
      | Participant | meetingID | roomType |
      | dummy_user2 | context   | audio    |
    Then destroy audio room

  @DTMF
  @DTMFERR
  @TMU-22717
  Scenario: user dial-in to conference, infoType PLAY_NOT_EXIST_PROMPT
    Given System is running on MCU_HOME
    Given create conference 120003
    When create audio room for host dummy_user3
    And add participant dummy_user3 with meetingID context with caseType DIAL_IN and infoType PLAY
    And start stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType | streamFile |
      | dummy_user3 | context   | audio    | dtmf_123#  |
    Then validate INFO is received after 10 sec for dummy_user3 with messageIndex 1 and name: 410
    Then Sleep 10 sec in case STREAM set to TRUE
    Then destroy audio room

  @DTMF
  @TMU-22718
  Scenario: user dial-in to conference, infoType COLLECT_NOINPUT
    Given System is running on MCU_HOME
    Given create conference 120004
    When create audio room for host dummy_user4
    And add participant dummy_user4 with meetingID context with caseType DIAL_IN and infoType COLLECT_NOINPUT
    And start stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType | streamFile |
      | dummy_user4 | context   | audio    | dtmf_123#_delay  |
    Then validate INFO is received after 10 sec for dummy_user4 with messageIndex 1 and name: dtmf.noinput
    Then validate INFO is received after 10 sec for chandler with messageIndex 2 and name: msml.dialog.exit
    Then Sleep 10 sec in case STREAM set to TRUE
    Then destroy audio room

  @DTMF
  @TMU-22719
  Scenario: user dial-in to conference, infoType COLLECT_NOMATCH
    Given System is running on MCU_HOME
    Given create conference 120005
    When create audio room for host dummy_user5
    And add participant dummy_user5 with meetingID context with caseType DIAL_IN and infoType COLLECT_NOMATCH
    And start stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType | streamFile |
      | dummy_user5 | context   | audio    | dtmf_123#  |
    Then validate INFO is received after 10 sec for dummy_user5 with messageIndex 1 and name: dtmf.nomatch
    Then validate INFO is received after 10 sec for chandler with messageIndex 2 and name: msml.dialog.exit
    Then Sleep 10 sec in case STREAM set to TRUE
    Then destroy audio room

  @DTMF
  @TMU-23472
    # semi manual test - need to create text file on media-server first
  Scenario: user dial-in to conference, infoType PLAY_WRONG_FOUND
    Given System is running on MCU_HOME
    Given create conference 120006
    When create audio room for host dummy_user6
    And add participant dummy_user6 with meetingID context with caseType DIAL_IN and infoType PLAY_WRONG_FOUND
    And start stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType | streamFile |
      | dummy_user6 | context   | audio    | dtmf_123#  |
    Then validate INFO is received after 10 sec for dummy_user6 with messageIndex 1 and name: 410
    Then Sleep 10 sec in case STREAM set to TRUE
    Then destroy audio room

  @DTMF
  @TMU-27032
  @mute
  @MCU-2614
  Scenario: mute PSTN user
    Given System is running on MCU_HOME
    Given create conference 120007
    When create audio room for host chandler
    And add participant:
      | Participant | meetingID | roomType | userType | deviceType |
      | monica      | context   | audio    |          |            |
      | chandler    | context   | audio    | pstn     | PSTN       |
      | ross        | context   | audio    | pstn     | PSTN       |
    And start stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType | streamFile |
      | monica      | context   | audio    | audio1     |
      | ross        | context   | audio    | audio5     |
    Then Sleep 10 sec in case STREAM set to TRUE
    And participant chandler send INFO with meetingID context with caseType DIAL_IN and infoType COLLECT
    And start stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType | streamFile |
      | chandler    | context   | audio    | dtmf_11#   |
    Then validate INFO is received after 10 sec for chandler with messageIndex 1 and name: dtmf.detect DTMFs: 11# and 3 digits
    Then validate INFO is received after 10 sec for chandler with messageIndex 2 and name: msml.dialog.exit
    Then Sleep 10 sec in case STREAM set to TRUE
    And validate stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType |
      | chandler    | context   | audio    |
      | ross        | context   | audio    |
      | monica      | context   | audio    |
    And stop stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType |
      | chandler    | context   | audio    |
      | ross        | context   | audio    |
      | monica      | context   | audio    |
    And leave participant:
      | Participant | meetingID | roomType |
      | ross        | context   | audio    |
      | chandler    | context   | audio    |
      | monica      | context   | audio    |
    Then destroy audio room


  @sanity
  @DTMF
  @TMU-30968
  Scenario: support play.amt
    Given System is running on MCU_HOME
    Given create conference 120008
    When create audio room for host dummy_user8
    And add participant dummy_user8 with meetingID context with caseType DIAL_IN and infoType PLAY_AMT
    And start stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType | streamFile |
      | dummy_user8 | context   | audio    | audio1  |
    Then validate INFO is received after 10 sec for dummy_user8 with messageIndex 1 and name: moml.exit play.amt: 3646 and play.end: play.complete
    Then validate INFO is received after 10 sec for chandler with messageIndex 2 and name: msml.dialog.exit
    Then Sleep 10 sec in case STREAM set to TRUE
    And validate stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType |
      | dummy_user8 | context   | audio    |
    And stop stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType |
      | dummy_user8 | context   | audio    |
    And leave participant:
      | Participant | meetingID | roomType |
      | dummy_user8 | context   | audio    |
    Then destroy audio room


  @sanity
  @DTMF
  @TMU-31001
  Scenario: play in HOLD user
    Given System is running on MCU_HOME
    Given create conference 120009
    When create audio room for host chandler
    And add participant:
      | Participant | meetingID | roomType | userType | deviceType |
      | chandler    | context   | audio    | pstn     | PSTN       |
      | ross        | context   | audio    | pstn     | PSTN       |
    And chandler reInvite in audio-video roomType as recvonly
    And ross reInvite in audio-video roomType as sendonly
#    And start stream in case STREAM set to TRUE:
#      | Participant | meetingID | roomType | streamFile |
#      | chandler    | context   | audio    | audio1     |
#      | ross        | context   | audio    | audio5     |
#    Then Sleep 10 sec in case STREAM set to TRUE
    And participant chandler send INFO with meetingID context with caseType DIAL_IN and infoType PLAY_AMT
    Then validate INFO is received after 10 sec for chandler with messageIndex 1 and name: moml.exit play.amt: 3646 and play.end: play.complete
    Then validate INFO is received after 10 sec for chandler with messageIndex 2 and name: msml.dialog.exit
    Then Sleep 10 sec in case STREAM set to TRUE
#    And validate stream in case STREAM set to TRUE:
#      | Participant | meetingID | roomType |
#      | chandler    | context   | audio    |
#    And stop stream in case STREAM set to TRUE:
#      | Participant | meetingID | roomType |
#      | chandler    | context   | audio    |
#      | ross        | context   | audio    |
    And leave participant:
      | Participant | meetingID | roomType |
      | ross        | context   | audio    |
      | chandler    | context   | audio    |
    Then destroy audio room

  @DTMF
  @MCU-2922
  @TMU-31676
  Scenario: PSTN user without controll session
    Given System is running on MCU_HOME
    Then enable skip by environment
    Given create conference 120010
    Given caseType is DTMF_USER
    Given infoType is PLAY_COLLECT
    When INVITE participant dummy_user10 with meetingId context and audio roomType
    And JOIN participant dummy_user10 with meetingId context and roomType audio
    And start stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType | streamFile |
      | dummy_user10 | context   | audio    | dtmf_123#  |
    Then validate INFO is received after 10 sec for dummy_user10 with messageIndex 1 and name: dtmf.detect DTMFs: 123# and 4 digits
    Then validate INFO is received after 10 sec for dummy_user10 with messageIndex 2 and name: msml.dialog.exit
    Then Sleep 10 sec in case STREAM set to TRUE
    And stop stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType |
      | dummy_user10 | context   | audio    |
    And leave participant:
      | Participant | meetingID | roomType |
      | dummy_user10 | context   | audio    |



  @DTMF
  @TMU-32183
  Scenario: user dial-in to conference, infoType PLAY_COLLECT and STOP
    Given System is running on MCU_HOME
    Given create conference 120002
    When create audio room for host dummy_user11
    And add participant dummy_user11 with meetingID context with caseType DIAL_IN and infoType PLAY_COLLECT
    And participant dummy_user11 send INFO with meetingID context with caseType DIAL_IN and infoType PLAY_END
    And start stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType | streamFile |
      | dummy_user11 | context   | audio    | dtmf_123#  |
#    Then validate INFO is received after 30 sec for dummy_user11 with messageIndex 1 and name: dtmf.detect- DTMFs: 123# and 4 digits
#    Then validate INFO is received after 30 sec for dummy_user11 with messageIndex 2 and name: msml.dialog.exit-
    Then Sleep 10 sec in case STREAM set to TRUE
    And validate stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType |
      | dummy_user11 | context   | audio    |
    And stop stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType |
      | dummy_user11 | context   | audio    |
    And leave participant:
      | Participant | meetingID | roomType |
      | dummy_user11 | context   | audio    |
    Then destroy audio room



  @DTMF
  @TMU-32182
  Scenario:  user dial-in to conference, infoType PLAY and STOP
    Given System is running on MCU_HOME
    Given create conference 1200012
    When create audio room for host dummy_user12
    And add participant dummy_user12 with meetingID context with caseType DIAL_IN and infoType PLAY_AMT
    And participant dummy_user12 send INFO with meetingID context with caseType DIAL_IN and infoType PLAY_END
    And start stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType | streamFile |
      | dummy_user12 | context   | audio    | audio1  |
    Then validate INFO is received after 10 sec for dummy_user12 with messageIndex 1 and name: moml.exit play.amt: <3646 and play.end: play.terminate
    Then validate INFO is received after 10 sec for dummy_user12 with messageIndex 2 and name: msml.dialog.exit
    Then Sleep 10 sec in case STREAM set to TRUE
    And validate stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType |
      | dummy_user12 | context   | audio    |
    And stop stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType |
      | dummy_user12 | context   | audio    |
    And leave participant:
      | Participant | meetingID | roomType |
      | dummy_user12 | context   | audio    |
    Then destroy audio room




