Feature: Cloud Recorder controller =>

  @cloud
  @recorder
  @TMU-31768
  Scenario: basic cloud recorder flow
    Given System is running on MCU_HOME
    Then enable skip by environment
    Given create conference 880015
    When create audio room for host chandler
    And add participant:
      | Participant | meetingID | roomType |
      | chandler    | context   | audio    |
      | ross        | context   | audio    |
    And start stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType | streamFile |
      | chandler    | context   | audio    | video1     |
      | ross        | context   | audio    | video3     |
    And chandler START RECORD record_1 in context meetingID
    Then Sleep 10 sec in case STREAM set to TRUE
    And chandler STOP RECORD record_1 in context meetingID
    Then validate NOTIFY INFO for succeed stop is received after 5 sec for chandler with messageIndex 1 and recordEnd: record.terminate
    Then validate NOTIFY INFO for exit stop is received after 5 sec for chandler with messageIndex 2 and stopEnd: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
    And chandler TRANSFER RECORD record_1 in context meetingID
    Then validate NOTIFY INFO for succeed transfer is received after 5 sec for chandler with messageIndex 3 and transferEnd: transfer.complete
    Then validate NOTIFY INFO for exit transfer is received after 5 sec for chandler with messageIndex 4 and transferEnd: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
    And stop stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType |
      | chandler    | context   | audio    |
      | ross        | context   | audio    |
    Then validate recorder file size in context meetingID
    And leave participant:
      | Participant | meetingID | roomType |
      | ross        | context   | audio    |
      | chandler    | context   | audio    |
    Then destroy audio room

  @cloud
  @recorder
  @TMU-31801
  @MCU-3041
  Scenario: start recording twice
    Given System is running on MCU_HOME
    Then enable skip by environment
    Given create conference 880016
    When create audio room for host chandler
    And add participant:
      | Participant | meetingID | roomType |
      | chandler    | context   | audio    |
      | ross        | context   | audio    |
    And start stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType | streamFile |
      | chandler    | context   | audio    | video1     |
      | ross        | context   | audio    | video3     |
    And chandler START RECORD record_1 in context meetingID
    Then Sleep 15 sec in case STREAM set to TRUE
    And chandler START RECORD record_1 in context meetingID
    Then Sleep 15 sec in case STREAM set to TRUE
    And chandler STOP RECORD record_1 in context meetingID
    Then validate NOTIFY INFO for succeed stop is received after 5 sec for chandler with messageIndex 1 and recordEnd: record.terminate
    Then validate NOTIFY INFO for exit stop is received after 5 sec for chandler with messageIndex 2 and stopEnd: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
    And chandler TRANSFER RECORD record_1 in context meetingID
    Then validate NOTIFY INFO for succeed transfer is received after 5 sec for chandler with messageIndex 3 and transferEnd: transfer.complete
    Then validate NOTIFY INFO for exit transfer is received after 5 sec for chandler with messageIndex 4 and transferEnd: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
    And stop stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType |
      | chandler    | context   | audio    |
      | ross        | context   | audio    |
    Then validate recorder file size in context meetingID
    And leave participant:
      | Participant | meetingID | roomType |
      | ross        | context   | audio    |
      | chandler    | context   | audio    |
    Then destroy audio room
     # manual step: need to verify that recorder doesn't start the recorder twice (only one client get busy)

# to view recorder files do this:
#   1. Login to master of K8s system
#   2. login to recorder controller pod by this command:
#  kubectl exec -ti -n mvnr-mtcil1-appln-ngn-mcu <recorder controller pod> bash
#   3. cd /var/data/record
#70
  @cloud
  @recorder
  @TMU-31805
  Scenario: stop recording twice
    Given System is running on MCU_HOME
    Then enable skip by environment
    Given create conference 880017
    When create audio room for host chandler
    And add participant:
      | Participant | meetingID | roomType |
      | chandler    | context   | audio    |
      | ross        | context   | audio    |
    And start stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType | streamFile |
      | chandler    | context   | audio    | video1     |
      | ross        | context   | audio    | video3     |
    And chandler START RECORD record_1 in context meetingID
    Then Sleep 20 sec in case STREAM set to TRUE
    And chandler STOP RECORD record_1 in context meetingID
    Then validate NOTIFY INFO for succeed stop is received after 5 sec for chandler with messageIndex 1 and recordEnd: record.terminate
    Then validate NOTIFY INFO for exit stop is received after 5 sec for chandler with messageIndex 2 and stopEnd: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
    And chandler STOP RECORD record_1 in context meetingID
    Then validate NOTIFY INFO for succeed stop is received after 5 sec for chandler with messageIndex 1 and recordEnd: record.terminate
    Then validate NOTIFY INFO for exit stop is received after 5 sec for chandler with messageIndex 2 and stopEnd: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
    And chandler TRANSFER RECORD record_1 in context meetingID
    Then validate NOTIFY INFO for succeed transfer is received after 5 sec for chandler with messageIndex 3 and transferEnd: transfer.complete
    Then validate NOTIFY INFO for exit transfer is received after 5 sec for chandler with messageIndex 4 and transferEnd: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
    And stop stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType |
      | chandler    | context   | audio    |
      | ross        | context   | audio    |
    Then validate recorder file size in context meetingID
    And leave participant:
      | Participant | meetingID | roomType |
      | ross        | context   | audio    |
      | chandler    | context   | audio    |
    Then destroy audio room

  @cloud
  @recorder
  @TMU-31809
  @MCU-3034
  @MCU-3082
  Scenario: stop record before start
    Given System is running on MCU_HOME
    Then enable skip by environment
    Given create conference 880018
    When create audio room for host chandler
    And add participant:
      | Participant | meetingID | roomType |
      | chandler    | context   | audio    |
      | ross        | context   | audio    |
    And start stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType | streamFile |
      | chandler    | context   | audio    | video1     |
      | ross        | context   | audio    | video3     |
    And chandler STOP RECORD record_1 in context meetingID skipError true
    Then chandler should get errorCode: 500 response on INFO audio roomType
    And stop stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType |
      | chandler    | context   | audio    |
      | ross        | context   | audio    |
    And leave participant:
      | Participant | meetingID | roomType |
      | ross        | context   | audio    |
      | chandler    | context   | audio    |
    Then destroy audio room

#  @nightly
  @cloud
  @recorder
  @TMU-31810
  Scenario: transfer wrong source
    Given System is running on MCU_HOME
    Then enable skip by environment
    Given create conference 880019
    When create audio room for host chandler
    And add participant:
      | Participant | meetingID | roomType |
      | chandler    | context   | audio    |
      | ross        | context   | audio    |
    And start stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType | streamFile |
      | chandler    | context   | audio    | video1     |
      | ross        | context   | audio    | video3     |
      # START RECORD
    And chandler START RECORD record_1 in context meetingID
    Then Sleep 20 sec in case STREAM set to TRUE
      # STOP RECORD
    And chandler STOP RECORD record_1 in context meetingID
    Then validate NOTIFY INFO for succeed stop is received after 5 sec for chandler with messageIndex 1 and recordEnd: record.terminate
    Then validate NOTIFY INFO for exit stop is received after 5 sec for chandler with messageIndex 2 and stopEnd: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
      # TRANSFER WRONG SOURCE
    And chandler TRANSFER_WRONG_SOURCE RECORD record_1 in context meetingID
    Then validate NOTIFY INFO for succeed transfer is received after 5 sec for chandler with messageIndex 3 and transferEnd: transfer.failed
    Then validate NOTIFY INFO for exit transfer is received after 5 sec for chandler with messageIndex 4 and transferEnd: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
    #add additional succeed transfer for client free
    And chandler TRANSFER RECORD record_1 in context meetingID
    Then validate NOTIFY INFO for succeed transfer is received after 5 sec for chandler with messageIndex 5 and transferEnd: transfer.complete
    Then validate NOTIFY INFO for exit transfer is received after 5 sec for chandler with messageIndex 6 and transferEnd: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
    And stop stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType |
      | chandler    | context   | audio    |
      | ross        | context   | audio    |
    And leave participant:
      | Participant | meetingID | roomType |
      | ross        | context   | audio    |
      | chandler    | context   | audio    |
    Then destroy audio room

  @cloud
  @recorder
  @TMU-31812
  @MCU-3041
  @MCU-3082
  Scenario: second start record in same room
    Given System is running on MCU_HOME
    Then enable skip by environment
    Given create conference 880020
    When create audio room for host chandler
    And add participant:
      | Participant | meetingID | roomType |
      | chandler    | context   | audio    |
      | ross        | context   | audio    |
    And start stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType | streamFile |
      | chandler    | context   | audio    | video1     |
      | ross        | context   | audio    | video3     |
    And chandler START RECORD record_1 in context meetingID
    And ross START RECORD record_2 in context meetingID
    Then Sleep 20 sec in case STREAM set to TRUE
    And chandler STOP RECORD record_1 in context meetingID
    Then validate NOTIFY INFO for succeed stop is received after 5 sec for chandler with messageIndex 1 and recordEnd: record.terminate
    Then validate NOTIFY INFO for exit stop is received after 5 sec for chandler with messageIndex 2 and stopEnd: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
    And ross STOP RECORD record_2 in context meetingID skipError true
    Then ross should get errorCode: 500 response on INFO audio roomType
    And chandler TRANSFER RECORD record_1 in context meetingID
    Then validate NOTIFY INFO for succeed transfer is received after 5 sec for chandler with messageIndex 3 and transferEnd: transfer.complete
    Then validate NOTIFY INFO for exit transfer is received after 5 sec for chandler with messageIndex 4 and transferEnd: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
    And stop stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType |
      | chandler    | context   | audio    |
      | ross        | context   | audio    |
    Then validate recorder file size in context meetingID
    And leave participant:
      | Participant | meetingID | roomType |
      | ross        | context   | audio    |
      | chandler    | context   | audio    |
    Then destroy audio room
    # manual step: need to verify that record_2 started by ROSS wasnt started

#  @nightly
  @cloud
  @recorder
  @TMU-31813
  Scenario: third transfer succeed to upload file
    Given System is running on MCU_HOME
    Then enable skip by environment
    Given create conference 880021
    When create audio room for host chandler
    And add participant:
      | Participant | meetingID | roomType |
      | chandler    | context   | audio    |
      | ross        | context   | audio    |
    And start stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType | streamFile |
      | chandler    | context   | audio    | video1     |
      | ross        | context   | audio    | video3     |
    And chandler START RECORD record_1 in context meetingID
    Then Sleep 20 sec in case STREAM set to TRUE
    And chandler STOP RECORD record_1 in context meetingID
    Then validate NOTIFY INFO for succeed stop is received after 5 sec for chandler with messageIndex 1 and recordEnd: record.terminate
    Then validate NOTIFY INFO for exit stop is received after 5 sec for chandler with messageIndex 2 and stopEnd: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
    And chandler TRANSFER_WRONG_SOURCE RECORD record_1 in context meetingID
    Then validate NOTIFY INFO for succeed transfer is received after 5 sec for chandler with messageIndex 3 and transferEnd: transfer.failed
    Then validate NOTIFY INFO for exit transfer is received after 5 sec for chandler with messageIndex 4 and transferEnd: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
    And chandler TRANSFER_WRONG_SOURCE RECORD record_1 in context meetingID
    Then validate NOTIFY INFO for succeed transfer is received after 5 sec for chandler with messageIndex 5 and transferEnd: transfer.failed
    Then validate NOTIFY INFO for exit transfer is received after 5 sec for chandler with messageIndex 6 and transferEnd: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
    And chandler TRANSFER RECORD record_1 in context meetingID
    Then validate NOTIFY INFO for succeed transfer is received after 5 sec for chandler with messageIndex 7 and transferEnd: transfer.complete
    Then validate NOTIFY INFO for exit transfer is received after 5 sec for chandler with messageIndex 8 and transferEnd: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
    And stop stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType |
      | chandler    | context   | audio    |
      | ross        | context   | audio    |
    Then validate recorder file size in context meetingID
    And leave participant:
      | Participant | meetingID | roomType |
      | ross        | context   | audio    |
      | chandler    | context   | audio    |
    Then destroy audio room

  @cloud
  @recorder
  @TMU-32065
  @MCU-3035
  Scenario: 4th transfer failed to upload file
    Given System is running on MCU_HOME
    Then enable skip by environment
    Given create conference 880022
    When create audio room for host chandler
    And add participant:
      | Participant | meetingID | roomType |
      | chandler    | context   | audio    |
      | ross        | context   | audio    |
    And start stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType | streamFile |
      | chandler    | context   | audio    | video1     |
      | ross        | context   | audio    | video3     |
    And chandler START RECORD record_1 in context meetingID
    Then Sleep 20 sec in case STREAM set to TRUE
    And chandler STOP RECORD record_1 in context meetingID
    Then validate NOTIFY INFO for succeed stop is received after 5 sec for chandler with messageIndex 1 and recordEnd: record.terminate
    Then validate NOTIFY INFO for exit stop is received after 5 sec for chandler with messageIndex 2 and stopEnd: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
    And chandler TRANSFER_WRONG_SOURCE RECORD record_1 in context meetingID
    Then validate NOTIFY INFO for succeed transfer is received after 5 sec for chandler with messageIndex 3 and transferEnd: transfer.failed
    Then validate NOTIFY INFO for exit transfer is received after 5 sec for chandler with messageIndex 4 and transferEnd: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
    And chandler TRANSFER_WRONG_SOURCE RECORD record_1 in context meetingID
    Then validate NOTIFY INFO for succeed transfer is received after 5 sec for chandler with messageIndex 5 and transferEnd: transfer.failed
    Then validate NOTIFY INFO for exit transfer is received after 5 sec for chandler with messageIndex 6 and transferEnd: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
    And chandler TRANSFER_WRONG_SOURCE RECORD record_1 in context meetingID
    Then validate NOTIFY INFO for succeed transfer is received after 5 sec for chandler with messageIndex 7 and transferEnd: transfer.failed
    Then validate NOTIFY INFO for exit transfer is received after 5 sec for chandler with messageIndex 8 and transferEnd: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
    And chandler TRANSFER RECORD record_1 in context meetingID
    Then validate NOTIFY INFO for succeed transfer is received after 5 sec for chandler with messageIndex 9 and transferEnd: transfer.failed
    Then validate NOTIFY INFO for exit transfer is received after 5 sec for chandler with messageIndex 10 and transferEnd: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
    And stop stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType |
      | chandler    | context   | audio    |
      | ross        | context   | audio    |
    And leave participant:
      | Participant | meetingID | roomType |
      | ross        | context   | audio    |
      | chandler    | context   | audio    |
    Then destroy audio room
    #manual step: Verify that not transferred file is deleted from mstore

  @cloud
  @recorder
  @TMU-32066
  @MCU-3036
  Scenario: when all recorder clients are busy, start fail
    When set: ADDRESS MCU_HOME, USERS 2, ROOMS 4 -, SPEAK_USERS 2, VIDEO_PUB_USERS 2, FAILURE_MECHANISM FALSE
    And open audio rooms with participants and stream and mute NOT SPEAK_USERS with delay of 0 seconds between rooms and 0 seconds between users
    And user_1_0 START RECORD record_1 in room_1 meetingID
    And user_2_0 START RECORD record_1 in room_2 meetingID
    And user_3_0 START RECORD record_1 in room_3 meetingID
    And user_4_0 START RECORD record_1 in room_4 meetingID skipError true
    Then user_4_0 should get errorCode: 500 response on INFO audio roomType in room_4 meetingId
    Then Sleep 1 sec in case STREAM set to TRUE
    And user_1_0 STOP RECORD record_1 in room_1 meetingID
    Then Sleep 10 sec in case STREAM set to TRUE
    And user_4_0 START RECORD record_1 in room_4 meetingID
    And user_2_0 STOP RECORD record_1 in room_2 meetingID
    And user_3_0 STOP RECORD record_1 in room_3 meetingID
    Then Sleep 10 sec in case STREAM set to TRUE
    And user_4_0 STOP RECORD record_1 in room_4 meetingID
    And stop stream with delay of 0 seconds between rooms in case STREAM set to TRUE
    And user_1_0 TRANSFER RECORD record_1 in room_1 meetingID
    And user_2_0 TRANSFER RECORD record_1 in room_2 meetingID
    And user_3_0 TRANSFER RECORD record_1 in room_3 meetingID
    And user_4_0 TRANSFER RECORD record_1 in room_4 meetingID
    Then Sleep 10 sec in case STREAM set to TRUE
    Then validate recorder file size in room_1 meetingID
    Then validate recorder file size in room_2 meetingID
    Then validate recorder file size in room_3 meetingID
    Then validate recorder file size in room_4 meetingID
    And close audio rooms with participants with delay of 0 seconds between rooms

  @nightly
  @cloud
  @recorder
  @TMU-32209
  Scenario: leave participants before stop record
    Given System is running on MCU_HOME
    Then enable skip by environment
    Given create conference 880024
    When create audio room for host chandler
    And add participant:
      | Participant | meetingID | roomType |
      | chandler    | context   | audio    |
      | ross        | context   | audio    |
    And start stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType | streamFile |
      | chandler    | context   | audio    | video1     |
      | ross        | context   | audio    | video3     |
    And chandler START RECORD record_1 in context meetingID
    Then Sleep 30 sec in case STREAM set to TRUE
    And stop stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType |
      | chandler    | context   | audio    |
      | ross        | context   | audio    |
    And leave participant:
      | Participant | meetingID | roomType |
      | ross        | context   | audio    |
      | chandler    | context   | audio    |
    Then Sleep 5 sec in case STREAM set to TRUE
    And chandler STOP RECORD record_1 in context meetingID
    Then validate NOTIFY INFO for succeed stop is received after 10 sec for chandler with messageIndex 1 and recordEnd: record.terminate
    Then validate NOTIFY INFO for exit stop is received after 10 sec for chandler with messageIndex 2 and stopEnd: msml.dialog.exit
    Then Sleep 10 sec in case STREAM set to TRUE
    And chandler TRANSFER RECORD record_1 in context meetingID
    Then validate NOTIFY INFO for succeed transfer is received after 10 sec for chandler with messageIndex 3 and transferEnd: transfer.complete
    Then validate NOTIFY INFO for exit transfer is received after 10 sec for chandler with messageIndex 4 and transferEnd: msml.dialog.exit
    Then Sleep 10 sec in case STREAM set to TRUE
    Then validate recorder file size in context meetingID
    Then validate audio room BYE
    Then Sleep 180 sec
    #stop and transfer done by UCC

  @nightly
  @cloud
  @recorder
  @TMU-32750
  Scenario: recorder is stopped when room is closed
    Given System is running on MCU_HOME
    Then enable skip by environment
    Given create conference 880024
    When create audio room for host chandler
    And add participant:
      | Participant | meetingID | roomType |
      | chandler    | context   | audio    |
      | ross        | context   | audio    |
    And start stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType | streamFile |
      | chandler    | context   | audio    | video1     |
      | ross        | context   | audio    | video3     |
    And chandler START RECORD record_1 in context meetingID
    Then Sleep 30 sec in case STREAM set to TRUE
    And stop stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType |
      | chandler    | context   | audio    |
      | ross        | context   | audio    |
    And leave participant:
      | Participant | meetingID | roomType |
      | ross        | context   | audio    |
      | chandler    | context   | audio    |
    Then validate audio room BYE
    Then Sleep 180 sec
    Then validate NOTIFY INFO for succeed stop is received after 10 sec for chandler with messageIndex 1 and recordEnd: record.terminate
    Then validate NOTIFY INFO for exit stop is received after 10 sec for chandler with messageIndex 2 and stopEnd: msml.dialog.exit
    Then Sleep 10 sec in case STREAM set to TRUE
    #for new platform
