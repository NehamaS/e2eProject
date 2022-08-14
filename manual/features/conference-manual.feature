Feature: mMCU Manual test

  @manual
  @TMU-20034
  Scenario: close room cleanup
    Given System is running on MCU_HOME
    Given create conference 600001
    When create audio room for host chandler
    And add participant:
      | Participant | meetingID | roomType |
      | chandler    | context   | audio    |
    Then Sleep 190 sec
    When create audio room for host chandler
    Then destroy audio room

  @metrics
  Scenario: metrics test
    Given System is running on MCU_HOME
    Given create conference 100031
    When create audio room for host chandler
    And add participant:
      | Participant | meetingID | roomType |
      | chandler    | context   | audio    |
   # When create data-channel room for host chandler
    And add participant:
      | Participant | meetingID | roomType | userType |
   #   | chandler    | context   | data-channel | sender   |
      | ross        | context   | audio    | sender   |
   #   | ross        | context   | data-channel | sender   |
      | eran        | context   | audio    | sender   |
   #   | eran        | context   | data-channel | sender   |
      | dikla       | context   | audio    | sender   |
    #  | dikla       | context   | data-channel | sender   |
    Then Sleep 180 sec
    And leave participant:
      | Participant | meetingID | roomType |
     # | ross        | context   | data-channel |
     # | chandler    | context   | data-channel |
      | ross        | context   | audio    |
      | chandler    | context   | audio    |
  #  Then destroy data-channel room
    Then destroy audio room

  @TMU-17739
  @takeover
  @screen-share
  @manual
  Scenario: Screen share reconnect
    Given System is running on MCU_HOME
    Given create conference 100114
    When create audio room for host chandler
    And add participant:
      | Participant |roomType | meetingID |
      | chandler    |audio    | context   |
      | ross        |audio    | context   |
    When create screen-share room for host ross
    Then ross is publisher
    And ross reInvite in screen-share roomType as SSPublisher
    And leave participant:
      | Participant |roomType     | meetingID |
      | ross        |screen-share | context   |
      | chandler    |audio        | context   |
      | ross        |audio        | context   |
    Then destroy screen-share room
    Then destroy audio room

    #need to verify by media-gateway log SS room closing fail:
    #"msg":"LeaveVideoRoomRequest Error","err":{"message":"timeout of 1500ms exceeded for callback anonymous","code":"ETIMEDOUT"}

  @manual
  @recorder
  @cloud
  @TMU-32746
  Scenario: remove recorder client while recording
    Given System is running on MCU_HOME
    Then enable skip by environment
    Given create conference 880246
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
    Then Sleep 120 sec in case STREAM set to TRUE
    # manually remone the recorder client pod the record that meeting
    #verify other recorder client continue the recording
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
#    Then validate recorder file size in context meetingID
    And leave participant:
      | Participant | meetingID | roomType |
      | ross        | context   | audio    |
      | chandler    | context   | audio    |
    Then destroy audio room

  @manual
  @recorder
  @cloud
  @TMU-32747
  Scenario: remove recorder controller while record
    Given System is running on MCU_HOME
    Then enable skip by environment
    Given create conference 880123
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
    Then Sleep 120 sec in case STREAM set to TRUE
    # remove recorder controller pod
    # verify record file exist on recorder client memory
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
  @TMU-32764
  @manual
  Scenario: record more then the record limit time
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
      | chandler    | context   | audio    | audio1     |
      | ross        | context   | audio    | audio5     |
    And chandler START RECORD record_1 in context meetingID
    Then Sleep 130 sec in case STREAM set to TRUE
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